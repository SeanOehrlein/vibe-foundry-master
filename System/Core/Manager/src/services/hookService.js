const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class HookService extends EventEmitter {
    constructor(hooksDir) {
        super();
        this.hooksDir = hooksDir;
        this.activeHooks = new Map();
        this.watcher = null;
    }

    /**
     * Initialize the Hook Service
     */
    async init() {
        console.log(`[HookService] Initializing hooks from: ${this.hooksDir}`);

        // Ensure hooks directory exists
        if (!fs.existsSync(this.hooksDir)) {
            console.log(`[HookService] Creating hooks directory...`);
            fs.mkdirSync(this.hooksDir, { recursive: true });
        }

        // Initialize Chokidar watcher
        this.watcher = chokidar.watch(this.hooksDir, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true
        });

        // Event Listeners
        this.watcher
            .on('add', (path) => this.loadHook(path))
            .on('change', (path) => this.reloadHook(path))
            .on('unlink', (path) => this.unloadHook(path));

        console.log('[HookService] Watcher started.');
    }

    loadHook(filePath) {
        if (path.extname(filePath) !== '.js') return;

        try {
            const hookName = path.basename(filePath, '.js');
            const hookModule = require(filePath);

            if (typeof hookModule.init === 'function') {
                console.log(`[HookService] Loading hook: ${hookName}`);
                hookModule.init(this); // Pass the HookService instance to the hook
                this.activeHooks.set(hookName, hookModule);
                this.emit('hook-loaded', hookName);
            } else {
                console.warn(`[HookService] Skipped ${hookName}: Missing init() function.`);
            }
        } catch (error) {
            console.error(`[HookService] Error loading hook ${filePath}:`, error);
        }
    }

    reloadHook(filePath) {
        console.log(`[HookService] Reloading hook: ${filePath}`);
        delete require.cache[require.resolve(filePath)]; // Clear cache
        this.loadHook(filePath);
    }

    unloadHook(filePath) {
        const hookName = path.basename(filePath, '.js');
        console.log(`[HookService] Unloading hook: ${hookName}`);
        this.activeHooks.delete(hookName);
    }
}

module.exports = HookService;

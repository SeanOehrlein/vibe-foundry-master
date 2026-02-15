/**
 * CyCOS Token Dashboard - Main Entry Point
 * Security-first token usage monitoring for operational intelligence
 */

import TerminalUI from './ui.js';
import { getStatus } from './status.js';
import CSVLogger from './csvLogger.js';

// Configuration
const REFRESH_INTERVAL_MS = 5000; // 5 seconds
const LOG_INTERVAL_MS = 60000; // 1 minute

/**
 * Main dashboard application
 */
class TokenDashboard {
    constructor() {
        this.ui = new TerminalUI();
        this.logger = new CSVLogger();
        this.running = false;
        this.lastLogTime = Date.now();
    }

    /**
     * Start the dashboard
     */
    async start() {
        this.running = true;

        // Handle graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());

        console.log('CyCOS Token Dashboard starting (Live Data Mode)...\n');
        console.log('Press Ctrl+C to exit\n');

        await this.sleep(1000);

        // Main loop
        while (this.running) {
            try {
                // Get current usage data
                const data = await getStatus();

                // Render dashboard
                this.ui.renderDashboard(data);

                // Log to CSV periodically
                if (Date.now() - this.lastLogTime >= LOG_INTERVAL_MS) {
                    await this.logUsage(data);
                    this.lastLogTime = Date.now();
                }

                // Wait before next refresh
                await this.sleep(REFRESH_INTERVAL_MS);
            } catch (error) {
                console.error('Dashboard error:', error.message);
                await this.sleep(REFRESH_INTERVAL_MS);
            }
        }
    }

    /**
     * Log current usage to CSV
     */
    async logUsage(data) {
        if (!data.models) return;

        for (const model of data.models) {
            await this.logger.log({
                model: model.name,
                thinkingTokens: 0,
                inputTokens: 0,
                outputTokens: model.limit - model.remaining,
                totalTokens: model.limit - model.remaining,
                conversationId: 'auto-sync',
                sessionId: 'session-' + Date.now(),
                system: 'Foundry-Prime'
            });
        }
    }

    /**
     * Stop the dashboard
     */
    stop() {
        this.running = false;
        this.ui.showCursor();
        this.ui.clear();
        console.log('\nCyCOS Token Dashboard stopped.');
        process.exit(0);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run dashboard
const dashboard = new TokenDashboard();
dashboard.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

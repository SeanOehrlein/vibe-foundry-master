const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const BRAIN_ROOT = 'C:/CyCOS/Foundry/Brain';
const INCOMING_DIR = path.join(BRAIN_ROOT, 'Incoming');
const ARCHIVE_DIR = path.join(BRAIN_ROOT, 'Archive');
const PENDING_DIR = path.join(BRAIN_ROOT, 'Pending'); // For Agent Fallback
const LOG_FILE = path.join(BRAIN_ROOT, 'Operations', 'uplink_log.md');
const OPERATIONS_INBOX = 'C:/CyCOS/Agencies/Operations/Inbox.md'; // Todoist placeholder
const PULSE_FILE = 'C:/CyCOS/Memory/LongTerm/Pulse.md';

// Ensure directories exist
[INCOMING_DIR, ARCHIVE_DIR, PENDING_DIR, path.dirname(LOG_FILE)].forEach(dir => {
    try {
        fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
        console.error(`[Directory Setup Error] Could not create directory ${dir}: ${e.message}`);
    }
});

// API Setup
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

function logAction(action, details) {
    const timestamp = new Date().toISOString();
    const logEntry = `| ${timestamp} | ${action} | ${details} |\n`;
    try {
        fs.appendFileSync(LOG_FILE, logEntry);
        console.log(`[Log] ${action}: ${details}`);
    } catch (e) {
        console.error(`[Log Error] ${e.message}`);
    }
}

async function classifyContent(text) {
    if (!model) return { items: [{ type: 'RAW', content: text }] };

    const prompt = `
    Analyze this input. It may contain multiple distinct items (Tasks, Ideas, Events).
    Extract them into a JSON list with keys: type (TASK, IDEA, EVENT, URL), content, priority/date/context.
    Input: "${text}"
    Output JSON ONLY.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        // Clean markdown code blocks if present
        const jsonStr = textResponse.replace(/^```json\n|\n```$/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error(`[AI Error] ${e.message}`);
        return { items: [{ type: 'RAW', content: text, error: e.message }] };
    }
}

async function routeItem(item) {
    const timestamp = new Date().toISOString().split('T')[0];

    if (item.type === 'TASK') {
        const taskLine = `- [ ] ${item.content} (Priority: ${item.priority || 'Normal'}) #sourced/uplink\n`;
        fs.appendFileSync(OPERATIONS_INBOX, taskLine);
        logAction('ROUTED_TASK', item.content);
    }
    else if (item.type === 'IDEA') {
        const ideaBlock = `\n## New Idea (${timestamp})\n${item.content}\n> Context: ${item.context || 'N/A'}\n`;
        fs.appendFileSync(PULSE_FILE, ideaBlock);
        logAction('ROUTED_IDEA', item.content);
    }
    else if (item.type === 'URL') {
        const urlLine = `\n- [ ] RECON: ${item.content} (${item.description || 'No desc'})\n`;
        fs.appendFileSync(PULSE_FILE, urlLine); // Temp: Needs Repo Recon Queue
        logAction('ROUTED_URL', item.content);
    }
    else {
        // Fallback for events/raw
        const dumpFile = path.join(BRAIN_ROOT, 'Operations', 'brain_dump_review.md');
        fs.appendFileSync(dumpFile, `\n### Unsorted (${timestamp})\n${JSON.stringify(item)}\n`);
        logAction('ROUTED_RAW', 'Saved to brain_dump_review.md');
    }
}

async function processFile(filePath, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`[Processing] ${fileName}...`);

        let processingType = 'Raw (No API)';

        if (model) {
            const data = await classifyContent(content);
            if (data.items && Array.isArray(data.items)) {
                for (const item of data.items) {
                    await routeItem(item);
                }
                processingType = `AI Classified (${data.items.length} items)`;

                // Route 1: Archive (Success)
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const archivePath = path.join(ARCHIVE_DIR, `${timestamp}_${fileName}`);
                safeMove(filePath, archivePath, processingType);
            }
        } else {
            // Route 2: Pending (Agent Fallback)
            // We do NOT archive. We move to 'Pending' for the User/Agent to process manually at Stand-up.
            const pendingPath = path.join(PENDING_DIR, fileName);
            safeMove(filePath, pendingPath, "Moved to Pending (No API Key)");
        }

    } catch (error) {
        logAction('ERROR', `Processing failed: ${error.message}`);
    }
}

function safeMove(src, dest, logMsg) {
    setTimeout(() => {
        try {
            fs.renameSync(src, dest);
            logAction('MOVED', logMsg);
        } catch (err) {
            logAction('ERROR', `Move failed: ${err.message}`);
        }
    }, 1000);
}

// Watcher Initialization
console.log(`[Smart Ingestor] Initializing on: ${INCOMING_DIR}`);
if (!API_KEY) console.warn('[Warning] No GEMINI_API_KEY found. Running in Raw Mode.');

const watcher = chokidar.watch(INCOMING_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 }
});

watcher
    .on('add', (filePath) => processFile(filePath, path.basename(filePath)))
    .on('error', error => console.error(`[Watcher Error] ${error}`));

/**
 * CyCOS Token Dashboard - CSV Logger
 * Security-first implementation using only Node.js built-ins
 * Append-only logging for operational intelligence and research
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CSV Logger for token usage tracking
 */
class CSVLogger {
    constructor(logPath) {
        this.logPath = logPath || path.join(__dirname, '../../../Memory/LongTerm/Analytics/token_usage.csv');
        this.ensureLogFile();
    }

    /**
     * Ensure log file exists with headers
     */
    ensureLogFile() {
        const dir = path.dirname(this.logPath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Create file with headers if it doesn't exist
        if (!fs.existsSync(this.logPath)) {
            const headers = 'timestamp,model,thinking_tokens,input_tokens,output_tokens,total_tokens,conversation_id,session_id,system\n';
            fs.writeFileSync(this.logPath, headers, 'utf8');
        }
    }

    /**
     * Log a token usage entry
     * @param {Object} entry - Token usage data
     */
    async log(entry) {
        const {
            model = 'unknown',
            thinkingTokens = 0,
            inputTokens = 0,
            outputTokens = 0,
            conversationId = '',
            sessionId = '',
            system = 'Foundry-Prime'
        } = entry;

        const timestamp = new Date().toISOString();
        const totalTokens = thinkingTokens + inputTokens + outputTokens;

        const row = [
            timestamp,
            model,
            thinkingTokens,
            inputTokens,
            outputTokens,
            totalTokens,
            conversationId,
            sessionId,
            system
        ].join(',') + '\n';

        // Append to file (atomic operation)
        return new Promise((resolve, reject) => {
            fs.appendFile(this.logPath, row, 'utf8', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Read all log entries
     */
    async readAll() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.logPath, 'utf8', (err, data) => {
                if (err) reject(err);
                else {
                    const lines = data.trim().split('\n');
                    const headers = lines[0].split(',');
                    const entries = lines.slice(1).map(line => {
                        const values = line.split(',');
                        return headers.reduce((obj, header, index) => {
                            obj[header] = values[index];
                            return obj;
                        }, {});
                    });
                    resolve(entries);
                }
            });
        });
    }

    /**
     * Get summary statistics
     */
    async getSummary() {
        const entries = await this.readAll();

        const summary = {
            totalEntries: entries.length,
            totalTokens: 0,
            byModel: {},
            bySystem: {},
            firstEntry: entries[0]?.timestamp || null,
            lastEntry: entries[entries.length - 1]?.timestamp || null
        };

        for (const entry of entries) {
            const tokens = parseInt(entry.total_tokens) || 0;
            summary.totalTokens += tokens;

            // By model
            if (!summary.byModel[entry.model]) {
                summary.byModel[entry.model] = { count: 0, tokens: 0 };
            }
            summary.byModel[entry.model].count++;
            summary.byModel[entry.model].tokens += tokens;

            // By system
            if (!summary.bySystem[entry.system]) {
                summary.bySystem[entry.system] = { count: 0, tokens: 0 };
            }
            summary.bySystem[entry.system].count++;
            summary.bySystem[entry.system].tokens += tokens;
        }

        return summary;
    }

    /**
     * Rotate log file (monthly)
     */
    async rotate() {
        const now = new Date();
        const archiveName = `token_usage_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
        const archivePath = path.join(path.dirname(this.logPath), 'archive', archiveName);

        // Create archive directory
        const archiveDir = path.dirname(archivePath);
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }

        // Move current log to archive
        return new Promise((resolve, reject) => {
            fs.rename(this.logPath, archivePath, (err) => {
                if (err) reject(err);
                else {
                    this.ensureLogFile();
                    resolve(archivePath);
                }
            });
        });
    }
}

export default CSVLogger;

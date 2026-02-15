import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

/**
 * CyCOS Token Dashboard - Status Script
 * Extracts model names and quota units from Antigravity state database.
 */

const DB_PATH = join(homedir(), 'AppData', 'Roaming', 'Antigravity', 'User', 'globalStorage', 'state.vscdb');

function decodeVarint(buffer, offset) {
    let result = 0;
    let shift = 0;
    let i = offset;
    while (true) {
        let byte = buffer[i++];
        result |= (byte & 0x7f) << shift;
        if (!(byte & 0x80)) break;
        shift += 7;
    }
    return { val: result, next: i };
}

export async function getStatus() {
    try {
        const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
        const row = db.prepare("SELECT value FROM ItemTable WHERE key = 'antigravityAuthStatus'").get();
        db.close();

        if (!row) return { error: 'No auth status found' };

        const data = JSON.parse(row.value);
        if (!data.userStatusProtoBinaryBase64) return { error: 'No user status binary found' };

        const buffer = Buffer.from(data.userStatusProtoBinaryBase64, 'base64');
        const modelsResult = [];

        // Simple scanner for model names and quotas
        // Model entry usually starts with 0x0A (or 0x05 for the very first one sometimes)
        // We will look for strings that look like model names
        const modelNames = [
            'Gemini 3 Pro (High)',
            'Gemini 3 Pro (Low)',
            'Gemini 3 Flash',
            'Claude Sonnet 4.5',
            'Claude Sonnet 4.5 (Thinking)',
            'Claude Opus 4.5 (Thinking)',
            'Claude Opus 4.6 (Thinking)',
            'GPT-OSS 120B (Medium)'
        ];

        for (const name of modelNames) {
            const nameIdx = buffer.indexOf(Buffer.from(name));
            if (nameIdx !== -1) {
                // The quota is usually shortly after the name
                // Look for the "12 03" pattern (length delimited field of size 3)
                // or just scan for the next varint after the name
                let searchIdx = nameIdx + name.length;
                let quota = null;

                // Scan forward up to 20 bytes
                for (let i = searchIdx; i < searchIdx + 20; i++) {
                    if (buffer[i] === 0x12 && buffer[i + 1] === 0x03 && buffer[i + 2] === 0x08) {
                        const decoded = decodeVarint(buffer, i + 3);
                        quota = decoded.val;
                        break;
                    }
                }

                modelsResult.push({
                    name,
                    limit: quota || 1000,
                    current: 0, // We only see remaining in the DB usually
                    remaining: quota,
                    units: 'credits'
                });
            }
        }

        return {
            timestamp: new Date().toISOString(),
            models: modelsResult,
            source: 'state.vscdb'
        };
    } catch (e) {
        return { error: e.message };
    }
}

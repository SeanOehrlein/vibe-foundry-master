/**
 * CyCOS Copilot - Resource Awareness Module
 * "The Fuel Gauge"
 * 
 * connects to Antigravity state.vscdb to analyze token quotas for Gemini 3 models.
 * Recommends model usage based on abundance.
 */

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Configuration
const DB_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'Antigravity', 'User', 'globalStorage', 'state.vscdb');

// Thresholds
const HIGH_QUOTA_GREEN = 700; // > 700 units (approx 70%) -> Use High freely
const HIGH_QUOTA_YELLOW = 300; // 300-700 units -> Be conservative

// Helper to decode Varint (from Protobuf)
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

function getResourceStatus() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { error: 'State DB not found', recommendation: 'Unknown', highQuota: 0 };
        }

        const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
        const row = db.prepare("SELECT value FROM ItemTable WHERE key = 'antigravityAuthStatus'").get();
        db.close();

        if (!row || !row.value) return { error: 'No auth status', recommendation: 'Unknown', highQuota: 0 };

        const data = JSON.parse(row.value);
        if (!data.userStatusProtoBinaryBase64) return { error: 'No quota binary', recommendation: 'Unknown', highQuota: 0 };

        const buffer = Buffer.from(data.userStatusProtoBinaryBase64, 'base64');

        // Find Gemini 3 Pro (High)
        // We scan for the string "Gemini 3 Pro (High)" and look for the quota value following it
        const targetName = 'Gemini 3 Pro (High)';
        const nameIdx = buffer.indexOf(Buffer.from(targetName));

        let highQuota = 0;

        if (nameIdx !== -1) {
            let searchIdx = nameIdx + targetName.length;
            // Scan forward up to 50 bytes for the quota field
            for (let i = searchIdx; i < searchIdx + 50; i++) {
                if (buffer[i] === 0x12 && buffer[i + 1] === 0x03 && buffer[i + 2] === 0x08) {
                    const decoded = decodeVarint(buffer, i + 3);
                    highQuota = decoded.val;
                    break;
                }
            }
        }

        // Logic Engine
        let status = 'RED';
        let recommendation = 'Critical: Use Flash Only';
        let reasoning = 'High quota is critically low (< 30%).';

        if (highQuota > HIGH_QUOTA_GREEN) {
            status = 'GREEN';
            recommendation = 'Use Gemini 3 Pro (High)';
            reasoning = 'High quota is abundant (> 70%).';
        } else if (highQuota > HIGH_QUOTA_YELLOW) {
            status = 'YELLOW';
            recommendation = 'Plan with High, Execute with Flash';
            reasoning = 'High quota is moderate (30-70%). Conserve for reasoning tasks.';
        }

        return {
            timestamp: new Date().toISOString(),
            highQuota: highQuota,
            status: status,
            recommendation: recommendation,
            reasoning: reasoning
        };

    } catch (error) {
        return { error: error.message, recommendation: 'Error', highQuota: 0 };
    }
}

// Run if called directly
if (require.main === module) {
    const result = getResourceStatus();
    console.log(JSON.stringify(result, null, 2));
}

module.exports = { getResourceStatus };

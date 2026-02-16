const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../../Core/Manager/.env' }); // Bind to Core Env

const app = express();
const PORT = process.env.C2_PORT || 3001; // 3000 is usually Manager

app.use(cors());
app.use(express.json());

// --- PATHS ---
const PATHS = {
    INBOX: path.resolve('c:/CyCOS/Agencies/Operations/Inbox.md'),
    TOOLS: path.resolve('c:/CyCOS/Agencies/Technical/Tools/Active'),
    SENTINEL: path.resolve('c:/CyCOS/Agencies/Security/Personas/Sentinel.md')
};

// --- ROUTES ---

// 1. System Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ONLINE',
        system: 'CyCOS Sovereign OS',
        timestamp: new Date().toISOString()
    });
});

// 2. Inbox Feed
app.get('/api/inbox', (req, res) => {
    try {
        if (fs.existsSync(PATHS.INBOX)) {
            const content = fs.readFileSync(PATHS.INBOX, 'utf-8');
            res.json({ success: true, content });
        } else {
            res.json({ success: false, message: 'Inbox not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Active Tools
app.get('/api/tools', (req, res) => {
    try {
        if (fs.existsSync(PATHS.TOOLS)) {
            const files = fs.readdirSync(PATHS.TOOLS).filter(f => f.endsWith('.py'));
            res.json({ success: true, count: files.length, tools: files });
        } else {
            res.json({ success: false, tools: [] });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- START ---
app.listen(PORT, () => {
    console.log(`[CyCOS C2] Bridge Online at http://localhost:${PORT}`);
    console.log(`[CyCOS C2] Monitoring: ${PATHS.INBOX}`);
});

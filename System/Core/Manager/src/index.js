const express = require('express');
const path = require('path');
const HookService = require('./services/hookService');
const ExecutionService = require('./services/executionService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Services
const hooksDir = path.join(__dirname, '../Hooks');
const hookService = new HookService(hooksDir);
const executionService = new ExecutionService();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ status: 'online', service: 'Vibe Coding Master Orchestrator' });
});

app.post('/execute', async (req, res) => {
    const { task, context, session_id } = req.body;
    if (!task) {
        return res.status(400).json({ error: 'Task description is required' });
    }

    try {
        const result = await executionService.execute(task, context, session_id || 'default_session');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', async (req, res) => {
    const pythonOnline = await executionService.isOnline();
    res.json({
        manager: 'online',
        execution_layer: pythonOnline ? 'online' : 'offline'
    });
});

// Start Server
app.listen(PORT, async () => {
    console.log(`[Manager] Server running on port ${PORT}`);

    // Initialize Hooks
    try {
        await hookService.init();
    } catch (err) {
        console.error('[Manager] Failed to init hooks:', err);
    }
});

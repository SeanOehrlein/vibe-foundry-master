const axios = require('axios');

class ExecutionService {
    constructor(executionUrl = 'http://localhost:8000') {
        this.executionUrl = executionUrl;
    }

    /**
     * Delegate a task to the Python Execution Layer
     * @param {string} task - The task description
     * @param {Object} context - Optional context data
     * @returns {Promise<Object>} - The result from the execution layer
     */
    async execute(task, context = {}, session_id = 'default_session') {
        console.log(`[ExecutionService] Sending task to Python layer: ${task} (Session: ${session_id})`);
        try {
            const response = await axios.post(`${this.executionUrl}/execute`, {
                task: task,
                context: context,
                session_id: session_id
            });
            return response.data;
        } catch (error) {
            console.error('[ExecutionService] Error communicating with Python layer:', error.message);
            throw new Error(`Execution Layer communication failed: ${error.message}`);
        }
    }

    /**
     * Check if the Execution Layer is online
     * @returns {Promise<boolean>}
     */
    async isOnline() {
        try {
            const response = await axios.get(this.executionUrl);
            return response.data.status === 'online';
        } catch (error) {
            return false;
        }
    }
}

module.exports = ExecutionService;

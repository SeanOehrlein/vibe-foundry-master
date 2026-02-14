module.exports = {
    init: async (hookService) => {
        console.log('[Hook] System Start initializing...');

        // Example: Wait for Execution Layer to be ready and log skills
        setTimeout(async () => {
            const executionService = new (require('../src/services/executionService'))();
            const isOnline = await executionService.isOnline();
            if (isOnline) {
                try {
                    const result = await require('axios').get('http://localhost:8000/skills');
                    const skills = result.data.skills;
                    console.log(`[Hook] Execution Layer Online. Sub-systems loaded: ${skills.length} skills found.`);
                    skills.forEach(s => console.log(`  - ${s.name}: ${s.description}`));
                } catch (err) {
                    console.error('[Hook] Failed to fetch skills:', err.message);
                }
            } else {
                console.warn('[Hook] Execution Layer is offline.');
            }
        }, 5000); // Wait for boot
    }
};

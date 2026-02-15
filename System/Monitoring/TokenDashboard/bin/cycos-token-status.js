#!/usr/bin/env node

/**
 * CyCOS Token Status CLI
 * Runs a single status check and exits.
 */

import { getStatus } from '../src/status.js';
import TerminalUI from '../src/ui.js';

async function main() {
    try {
        const ui = new TerminalUI();
        const data = await getStatus();

        if (data.error) {
            console.error('Error fetching token status:', data.error);
            process.exit(1);
        }

        // Render the dashboard once
        ui.renderDashboard(data);

        // Show cursor and exit
        ui.showCursor();
        process.exit(0);
    } catch (error) {
        console.error('Fatal CLI error:', error.message);
        process.exit(1);
    }
}

main();

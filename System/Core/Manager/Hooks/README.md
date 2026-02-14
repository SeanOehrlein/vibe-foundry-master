# Manager Hooks

This directory contains event listeners for the Node.js Manager.

## Purpose
To trigger automation workflows based on system events (file changes, time, webhooks).

## Implementation
*   Each Hook should be a separate module exporting an `init()` function.
*   Hooks should emit events that the Manager or Execution layer can act upon.

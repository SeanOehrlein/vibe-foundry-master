---
description: Automated session initialization for the Vibe Coding Master workspace.
---

# Stand-Up Protocol: Initialization & Sync

// turbo-all

Execute this workflow at the start of every session to ensure hardware, dependencies, and git state are synchronized between the desktop and laptop.

## 1. Automated Sync & Self-Healing
1. Run the Vibe Link to verify Git state, environment, and runtimes.
   ```powershell
   powershell -ExecutionPolicy Bypass -File "2. Library/1. Skills/vibe_init.ps1"
   ```

## 2. Context Retrieval
1. Read the [Pulse.md](file:///c:/1.%20SanEnso%20Vibe%20Coding/2.%20Library/4.%20Research/Pulse.md) for the latest system state and session history.
2. Read the [Roadmap.md](file:///c:/1.%20SanEnso%20Vibe%20Coding/2.%20Library/2.%20Instructions/Roadmap.md) to identify the current Phase and Active Tasks.
3. Read the active project [README.md](file:///c:/1.%20SanEnso%20Vibe%20Coding/1.%20Projects/sanenso-personal-ai-assistant/README.md).

---
*Status: Ready for Development.*

---
description: Automated session initialization for the Vibe Coding Master workspace.
---

# Stand-Up Protocol: Initialization & Sync

Execute this workflow at the start of every session to ensure hardware, dependencies, and git state are synchronized between the desktop and laptop.

## 1. Automated Sync & Health Check
// turbo
1. Run the System Sync utility to verify Git state, environment files, and runtimes.
   ```powershell
   powershell -ExecutionPolicy Bypass -File "2. Library/1. Skills/System_Sync.ps1"
   ```
2. If any items are [ERR] or [MISSING], resolve them before proceeding.

## 3. Dependency Management
// turbo
1. Check for `package.json` or `requirements.txt` changes.
2. Update Node dependencies if needed:
   ```powershell
   cd "1. Projects/sanenso-personal-ai-assistant/Manager"
   npm install
   ```
3. Verify Python virtual environment at `1. Projects/sanenso-personal-ai-assistant/Execution/venv`. If missing, recreate and install requirements.

## 4. Context Retrieval
1. Read the latest [Handoff_Memo.md](file:///c:/vibe-foundry-master/2.%20Library/4.%20Research/Handoff_Memo.md) for session-specific context.
2. Read the latest [Roadmap.md](file:///c:/vibe-foundry-master/2.%20Library/2.%20Instructions/Roadmap.md) to identify the current Phase and Active Tasks.
3. Read the active project [README.md](file:///c:/vibe-foundry-master/1.%20Projects/sanenso-personal-ai-assistant/README.md).

## 5. Environment Validation
1. Verify `.env` files exist in both `Manager/` and `Execution/` directories. Alert if missing.

---
*Status: Ready for Development.*

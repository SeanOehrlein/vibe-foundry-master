---
description: Automated session initialization for the Vibe Coding Master workspace.
---

# Stand-Up Protocol: Initialization & Sync

Execute this workflow at the start of every session to ensure hardware, dependencies, and git state are synchronized between the desktop and laptop.

## 1. Git Synchronization
// turbo
1. Fetch latest changes from the origin.
   ```powershell
   git fetch origin
   git status
   ```
2. If the local branch is behind, pull the latest changes before proceeding.

## 2. Infrastructure Health Check
// turbo
1. Verify core runtime versions.
   ```powershell
   node -v
   npm -v
   python --version
   ```
   *Expected: Node v24.13.1, npm 11.8.0, Python 3.14+*

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
1. Read the latest [Roadmap.md](file:///C:/1.%20SanEnso%20Vibe%20Coding/2.%20Library/2.%20Instructions/Roadmap.md) to identify the current Phase and Active Tasks.
2. Read the active project [README.md](file:///C:/1.%20SanEnso%20Vibe%20Coding/1.%20Projects/sanenso-personal-ai-assistant/README.md).

## 5. Environment Validation
1. Verify `.env` files exist in both `Manager/` and `Execution/` directories. Alert if missing.

---
*Status: Ready for Development.*

---
description: Automated session initialization for the CyCOS Sovereign Agentic Operating System.
---

# CyCOS Stand-Up: Sovereign Alignment

// turbo-all

Execute this workflow at the start of every session to ensure hardware, dependencies, and git state are synchronized between the desktop and laptop.

## 1. Automated Sync & Self-Healing
1. Run the Vibe Link to verify Git state, environment, and runtimes.
   ```powershell
   powershell -ExecutionPolicy Bypass -File "2. Library/1. Skills/vibe_init.ps1"
   ```

## 2. Context Retrieval
1. Read the [Pulse.md](file:///C:/CyCOS/Memory/LongTerm/Research/Pulse.md) for the latest system state and session history.
2. Read the [Roadmap.md](file:///C:/CyCOS/System/Registry/Roadmap.md) to identify the current Phase and Active Tasks.
3. Read the CyCOS Core [README.md](file:///C:/CyCOS/System/Core/README.md).

---
*Status: Ready for Development.*

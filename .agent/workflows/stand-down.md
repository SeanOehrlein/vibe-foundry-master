---
description: Automated session termination and synchronization for the CyCOS Sovereign Agentic Operating System.
---

# CyCOS Stand-Down: The Spark Handoff (DGX Native)

// turbo-all

Execute this workflow at the end of every active human-driven session to ensure all work is documented and the autonomous agents have the context they need to continue working.

## 1. Pulse Handoff

1. **Critical**: Open `Memory/LongTerm/Research/Pulse.md`.
2. Update the "Current Context" section with the accomplishments of your active session.
3. Add a new entry to "The Journal" with the current timestamp documenting any new ideas or pivots.

## 2. Autonomous Delegation

1. If you require overnight tasks (e.g., Code Reviews, Web research), write a clear mission in the `Workbench/Incoming` folder for the Subagencies to pick up.

## 3. Secure Synchronization

1. Ensure your active directories in `Workbench/Active_Workspaces` have their changes committed locally.
2. **Commit Work**:

   ```powershell
   git add .
   $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
   git commit -m "WIP: Human Developer Stand-Down $timestamp"
   ```

3. **Push to Remote**:

   ```powershell
   git push origin main
   ```

## 4. Disconnect

1. Ensure the DGX Spark is running stably.
2. Close your remote connection. The CyCOS OS and its internal containers will continue running independently.

---
*Status: Handoff Complete. Session Disconnected.*

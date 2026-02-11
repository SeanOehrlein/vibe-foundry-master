---
description: Automated session termination and synchronization for the Vibe Coding Master workspace.
---

# Stand-Down Protocol: Cleanup & Sync

Execute this workflow at the end of every session to ensure all work is documented, verified, and pushed to the central repository.

## 1. Process Cleanup
// turbo
1. Terminate any active Node.js or Python processes related to the Assistant.
   ```powershell
   # Manual stop of server processes
   ```

## 2. Technical Quality Scan
1. Perform a final review of all modified files.
2. Verify adherence to "Vibe Coding Master" standards (modular design, no legacy branding, professional naming).

## 3. Secure Synchronization
// turbo
1. Run System Sync to ensure all environment files are in parity.
   ```powershell
   powershell -ExecutionPolicy Bypass -File "2. Library/1. Skills/System_Sync.ps1"
   ```
2. Stage all changes.
   ```powershell
   git add .
   ```
3. Verify staged files for sensitive data (secrets, keys).
4. Generate a technical commit message following the "ARCH: [Summary]" or "FEAT: [Summary]" pattern.
5. Push to the central repository.
   ```powershell
   git push origin main
   ```

## 5. Handoff & Journaling
1. **Transient**: Update [Handoff_Memo.md](file:///C:/1.%20SanEnso%20Vibe%20Coding/2.%20Library/4.%20Research/Handoff_Memo.md).
    - **System ID**: [Foundry-Prime / Foundry-Mobile]
    - **Current Context**: What was being worked on in the last 5 minutes.
    - **Structure Status**: [Ready / Needs Reconciliation]
    - **Next Immediate Action**: The very first thing the next session should do.
2. **Permanent**: Prepend (Top of File) to [Development_Journal.md](file:///C:/1.%20SanEnso%20Vibe%20Coding/2.%20Library/4.%20Research/Development_Journal.md).
    - **Session ID**: [Date | Time | System ID]
    - Record Wins, Friction, Architectural Insights, and the session "Vibe".

---
*Status: Session Synchronized and Secured.*

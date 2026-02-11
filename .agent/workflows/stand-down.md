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
1. Stage all changes.
   ```powershell
   git add .
   ```
2. Verify staged files for sensitive data (secrets, keys).
3. Generate a technical commit message following the "ARCH: [Summary]" or "FEAT: [Summary]" pattern.
4. Push to the central repository.
   ```powershell
   git push origin main
   ```

## 5. Handoff Memo
1. Create or update [Handoff_Memo.md](file:///c:/vibe-foundry-master/2.%20Library/4.%20Research/Handoff_Memo.md).
2. Document:
    - **Current Context**: What was being worked on in the last 5 minutes.
    - **Stubborn Issues**: Any bugs or environment quirks found.
    - **Next Immediate Action**: The very first thing the next session should do.

---
*Status: Session Synchronized and Secured.*

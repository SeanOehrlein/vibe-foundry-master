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

## 4. Roadmap Update
1. Update [Roadmap.md](file:///C:/1.%20SanEnso%20Vibe%20Coding/2.%20Library/2.%20Instructions/Roadmap.md) with the session's accomplishments and define the "Next Stop" for the following session.

---
*Status: Session Synchronized and Secured.*

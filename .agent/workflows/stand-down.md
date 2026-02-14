---
description: Automated session termination and synchronization for the Vibe Coding Master workspace.
---

# Stand-Down Protocol: Cleanup & Sync

// turbo-all

Execute this workflow at the end of every session to ensure all work is documented, verified, and pushed to the central repository.

## 1. Pulse Check
1. **Critical**: Open [Pulse.md](file:///c:/1.%20SanEnso%20Vibe%20Coding/2.%20Library/4.%20Research/Pulse.md).
2. Update the "Current Context" section with what you just finished.
3. Add a new entry to "The Journal" with the current timestamp.

## 2. Secure Synchronization
1. Run System Sync to ensure environment parity before pushing.
   ```powershell
   powershell -ExecutionPolicy Bypass -File "2. Library/1. Skills/vibe_init.ps1"
   ```
2. Auto-Commit and Push Work.
   ```powershell
   git add .
   $msg = "WIP: Automated Stand-Down Sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
   git commit -m $msg
   git push origin main
   ```

---
*Status: Session Synchronized and Secured.*

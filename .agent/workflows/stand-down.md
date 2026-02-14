---
description: Automated session termination and synchronization for the CyCOS Sovereign Agentic Operating System.
---

# CyCOS Stand-Down: Sovereign Synchronization

// turbo-all

Execute this workflow at the end of every session to ensure all work is documented, verified, and pushed to the central repository.

## 1. Pulse Check
1. **Critical**: Open [Pulse.md](file:///C:/CyCOS/Memory/LongTerm/Research/Pulse.md).
2. Update the "Current Context" section with what you just finished.
3. Add a new entry to "The Journal" with the current timestamp.

## 2. Secure Synchronization
1. Run System Sync to ensure environment parity before pushing.
   ```powershell
   powershell -ExecutionPolicy Bypass -File "2. Library/1. Skills/vibe_init.ps1"
   ```
2. **Commit Work**:
   ```powershell
   git add .
   $msg = Read-Host "Enter commit message (or Enter for Auto-Sync)"
   if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "WIP: Automated Stand-Down Sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
   git commit -m $msg
   ```

## 3. Verification & Push
1. **Health Check**: Verify system stability before pushing.
   ```powershell
   # Run project specific tests here, e.g.:
   # npm test
   Write-Host "Ready to push."
   ```
2. **Push to Remote**:
   ```powershell
   git push origin main
   ```

---
*Status: Session Synchronized and Secured.*

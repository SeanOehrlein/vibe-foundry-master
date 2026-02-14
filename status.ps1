# CyCOS: Sovereign Dashboard
$CyCOSRoot = $PSScriptRoot
$StatePath = "$CyCOSRoot\System\Registry\active_state.json"
$RegistryPath = "$CyCOSRoot\System\Registry"

if (Test-Path $StatePath) {
    $State = Get-Content $StatePath | ConvertFrom-Json
}
else {
    Write-Host " [ERR] CyCOS Offline: State file missing." -ForegroundColor Red
    exit 1
}

Write-Host "`n--- [ CyCOS: Sovereign Dashboard ] ---" -ForegroundColor Cyan
Write-Host " Mode:    $($State.system_mode)" -ForegroundColor Yellow
Write-Host " Status:  $($State.session.status)" -ForegroundColor Green
Write-Host " Started: $($State.session.start_time)`n"

Write-Host "[ ACTIVE DEPLOYMENT ]" -ForegroundColor DarkCyan
Write-Host " Agency:    $($State.deployment.active_agency)" -ForegroundColor White
Write-Host " Workspace: $($State.deployment.active_workspace)" -ForegroundColor White
Write-Host " Mission:   $($State.deployment.current_mission)`n"

Write-Host "[ TELEMETRY ]" -ForegroundColor DarkCyan
Write-Host " Checkpoint: $($State.telemetry.last_checkpoint)" -ForegroundColor Gray
Write-Host " Policy V:   $($State.telemetry.active_policy_version)" -ForegroundColor Gray

Write-Host "`n[ READY ]`n" -ForegroundColor Cyan

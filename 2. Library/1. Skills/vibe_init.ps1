# Vibe Coding Master: Self-Healing Initialization
# Automatically repairs environment, dependencies, and git state.

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot
$WorkspaceRoot = Resolve-Path "$ScriptRoot\..\.."
$ProjectsRoot = "$WorkspaceRoot\1. Projects\sanenso-personal-ai-assistant"

Write-Host "`n--- [ Vibe Coding Master: Auto-Init ] ---" -ForegroundColor Cyan

# 1. Git Auto-Sync
Write-Host "[1/4] Git Sync..." -NoNewline
try {
    git fetch origin | Out-Null
    $Status = git status -uno
    if ($Status -match "Your branch is behind") {
        Write-Host " [BEHIND] Pulling..." -ForegroundColor Yellow
        git stash | Out-Null
        git pull | Out-Null
        git stash pop | Out-Null
        Write-Host "   [OK] Synced." -ForegroundColor Green
    }
    else {
        Write-Host " [OK] Up to date." -ForegroundColor Green
    }
}
catch {
    Write-Host " [ERR] Git sync failed: $_" -ForegroundColor Red
}

# 2. Environment Auto-Heal
Write-Host "[2/4] Environment Checks..."
$EnvDirs = @("Manager", "Execution")
foreach ($Dir in $EnvDirs) {
    $Path = "$ProjectsRoot\$Dir"
    $Example = "$Path\.env.example"
    $Actual = "$Path\.env"
    
    if (-not (Test-Path $Actual)) {
        if (Test-Path $Example) {
            Copy-Item $Example $Actual
            Write-Host "   - Created $Dir\.env from template." -ForegroundColor Yellow
        }
        else {
            Write-Host "   - [ERR] Missing .env.example in $Dir" -ForegroundColor Red
        }
    }
}
Write-Host "   [OK] Environments Ready." -ForegroundColor Green

# 3. Node Dependencies (Manager)
Write-Host "[3/4] Node.js Manager..." -NoNewline
if (-not (Test-Path "$ProjectsRoot\Manager\node_modules")) {
    Write-Host " [MISSING] Installing..." -ForegroundColor Yellow
    Push-Location "$ProjectsRoot\Manager"
    npm install --silent | Out-Null
    Pop-Location
    Write-Host "   [OK] Installed." -ForegroundColor Green
}
else {
    Write-Host " [OK] Found." -ForegroundColor Green
}

# 4. Python Venv (Execution)
Write-Host "[4/4] Python Execution..." -NoNewline
$VenvPath = "$ProjectsRoot\Execution\venv"
if (-not (Test-Path $VenvPath)) {
    Write-Host " [MISSING] Creating venv..." -ForegroundColor Yellow
    python -m venv $VenvPath
    Write-Host "   - Installing requirements..." -ForegroundColor Yellow
    & "$VenvPath\Scripts\pip" install -r "$ProjectsRoot\Execution\requirements.txt" --quiet
    Write-Host "   [OK] Created & Installed." -ForegroundColor Green
}
else {
    Write-Host " [OK] Found." -ForegroundColor Green
}

Write-Host "`n[VIBE CHECK PASSED] System Ready.`n" -ForegroundColor Cyan

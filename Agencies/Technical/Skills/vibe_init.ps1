# Vibe Coding Master: Self-Healing Initialization
# Automatically repairs environment, dependencies, and git state.

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot
$CyCOSRoot = Resolve-Path "$ScriptRoot\..\..\.."
$ProjectsRoot = "$CyCOSRoot\System\Core"

Write-Host "`n--- [ Vibe Coding Master: Auto-Init ] ---" -ForegroundColor Cyan

# 1. Git Auto-Sync
Write-Host "[1/4] Git Sync..." -NoNewline
try {
    git fetch origin | Out-Null
    $Status = git status -uno
    if ($Status -match "Your branch is behind") {
        $LocalChanges = git status --porcelain
        if ($LocalChanges) {
            Write-Host " [ERR] Local changes detected. Aborting auto-sync." -ForegroundColor Red
            Write-Host "       Please commit or stash your changes manually." -ForegroundColor Yellow
            exit 1
        }
        Write-Host " [BEHIND] Pulling..." -ForegroundColor Yellow
        git pull | Out-Null
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
    else {
        # Check if .env is older than .env.example
        if (Test-Path $Example) {
            $EnvTime = (Get-Item $Actual).LastWriteTime
            $ExampleTime = (Get-Item $Example).LastWriteTime
            if ($ExampleTime -gt $EnvTime) {
                Write-Host "   - [WARN] $Dir\.env is older than .env.example. Check for new keys." -ForegroundColor Yellow
            }
        }
    }
}
Write-Host "   [OK] Environments Ready." -ForegroundColor Green

# 3. Node Dependencies (Manager)
Write-Host "[3/4] Node.js Manager..." -NoNewline
if (Test-Path "$ProjectsRoot\Manager\package.json") {
    Push-Location "$ProjectsRoot\Manager"
    Write-Host " [CHECKING] Installing..." -ForegroundColor Yellow
    npm install --silent | Out-Null
    Pop-Location
    Write-Host "   [OK] Dependencies validated." -ForegroundColor Green
}
else {
    Write-Host " [SKIP] No package.json found." -ForegroundColor DarkGray
}

# 4. Python Venv (Execution)
Write-Host "[4/4] Python Execution..." -NoNewline
$VenvPath = "$ProjectsRoot\Execution\venv"
if (-not (Test-Path $VenvPath)) {
    Write-Host " [MISSING] Creating venv..." -ForegroundColor Yellow
    python -m venv $VenvPath
}

if (Test-Path "$ProjectsRoot\Execution\requirements.txt") {
    Write-Host " [CHECKING] Installing..." -ForegroundColor Yellow
    & "$VenvPath\Scripts\pip" install -r "$ProjectsRoot\Execution\requirements.txt" --quiet --upgrade
    Write-Host "   [OK] Dependencies validated." -ForegroundColor Green
}
else {
    Write-Host " [SKIP] No requirements.txt found." -ForegroundColor DarkGray
}

Write-Host "`n[VIBE CHECK PASSED] System Ready.`n" -ForegroundColor Cyan

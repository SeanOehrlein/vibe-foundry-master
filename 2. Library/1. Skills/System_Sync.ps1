# Vibe Coding Master: System Sync Utility
# Automates synchronization checks between Desktop and Laptop environments.

$Root = "c:\1. SanEnso Vibe Coding"
$ProjectsRoot = "$Root\1. Projects\sanenso-personal-ai-assistant"

Write-Host "`n--- [ Vibe Coding Master: System Sync ] ---" -ForegroundColor Cyan

# 1. Git Parity Check
Write-Host "[1/3] Checking Git Status..." -NoNewline
git fetch origin | Out-Null
$Status = git status -uno
if ($Status -match "Your branch is behind") {
    Write-Host " [ERR] Local is behind origin/main. Run 'git pull'." -ForegroundColor Red
} elseif ($Status -match "Your branch is up to date") {
    Write-Host " [OK] Fully synced with origin." -ForegroundColor Green
} else {
    Write-Host " [WARN] Unexpected Git state." -ForegroundColor Yellow
}

# 2. Environment Validation (.env vs .env.example)
Write-Host "[2/3] Validating Environment Files..."
$EnvDirs = @("Manager", "Execution")

foreach ($Dir in $EnvDirs) {
    $Path = "$ProjectsRoot\$Dir"
    $Example = "$Path\.env.example"
    $Actual = "$Path\.env"
    
    Write-Host "  - Checking $Dir... " -NoNewline
    if (-not (Test-Path $Actual)) {
        Write-Host "[MISSING] No .env found. Copy from .env.example." -ForegroundColor Red
    } else {
        $ExampleKeys = Get-Content $Example | Where-Object { $_ -match "^[^#\s]" } | ForEach-Object { $_.Split('=')[0].Trim() }
        $ActualKeys = Get-Content $Actual | Where-Object { $_ -match "^[^#\s]" } | ForEach-Object { $_.Split('=')[0].Trim() }
        
        $Missing = $ExampleKeys | Where-Object { $_ -notin $ActualKeys }
        if ($Missing) {
            Write-Host "[WARN] Missing keys: $($Missing -join ', ')" -ForegroundColor Yellow
        } else {
            Write-Host "[OK]" -ForegroundColor Green
        }
    }
}

# 3. Dependency Check
Write-Host "[3/3] Verifying Runtimes..."
$NodeVer = node -v
$PyVer = python --version
Write-Host "  - Node: $NodeVer"
Write-Host "  - Python: $PyVer"

if (-not (Test-Path "$ProjectsRoot\Execution\venv")) {
    Write-Host "  - [MISSING] Python venv not found in Execution layer." -ForegroundColor Red
} else {
    Write-Host "  - [OK] Python venv found." -ForegroundColor Green
}

Write-Host "-----------------------------------------`n"

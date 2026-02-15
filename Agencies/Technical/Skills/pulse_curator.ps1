# Intelligent Pulse Curator
# Maintains token-efficient history for cross-system handoff
# Keeps last 3 sessions in Pulse.md, archives older entries to PulseArchive.md

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# File paths
$pulseFile = "C:\CyCOS\Memory\LongTerm\Research\Pulse.md"
$archiveFile = "C:\CyCOS\Memory\LongTerm\Research\PulseArchive.md"
$keepSessions = 3

Write-Host "CyCOS Pulse Curator" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor DarkGray

# Verify files exist
if (-not (Test-Path $pulseFile)) {
    Write-Host "Error: Pulse.md not found at $pulseFile" -ForegroundColor Red
    exit 1
}

# Read Pulse.md
$pulseContent = Get-Content $pulseFile -Raw

# Extract journal entries using regex
# Pattern: ### [YYYY-MM-DD | HH:MM | System] - Title
$journalPattern = '(?m)^### \[(\d{4}-\d{2}-\d{2})[^\]]*\][^\r\n]*$'
$journalMatches = [regex]::Matches($pulseContent, $journalPattern)

if ($journalMatches.Count -eq 0) {
    Write-Host "No journal entries found to curate" -ForegroundColor Green
    exit 0
}

Write-Host "Found $($journalMatches.Count) journal entries" -ForegroundColor White

if ($journalMatches.Count -le $keepSessions) {
    Write-Host "Only $($journalMatches.Count) entries exist (keeping last $keepSessions)" -ForegroundColor Green
    Write-Host "No archiving needed" -ForegroundColor DarkGray
    exit 0
}

# Calculate how many to archive
$entriesToArchive = $journalMatches.Count - $keepSessions
Write-Host "Will archive $entriesToArchive oldest entries (keeping last $keepSessions)" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host ""
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Magenta
}

# Find the split point (after the Nth oldest entry to archive)
$splitIndex = $journalMatches[$entriesToArchive - 1].Index

# Extract content before "## The Journal" header
$journalHeaderPattern = '(?m)^## The Journal\s*$'
$journalHeaderMatch = [regex]::Match($pulseContent, $journalHeaderPattern)

if (-not $journalHeaderMatch.Success) {
    Write-Host "Error: Could not find '## The Journal' header" -ForegroundColor Red
    exit 1
}

$headerEndIndex = $journalHeaderMatch.Index + $journalHeaderMatch.Length

# Split content
$preamble = $pulseContent.Substring(0, $headerEndIndex)
$journalSection = $pulseContent.Substring($headerEndIndex)

# Find the position to split (relative to journal section)
$relativeSpitIndex = $splitIndex - $headerEndIndex

# Get the start of the entry AFTER the ones we want to archive
$remainingMatches = [regex]::Matches($journalSection, $journalPattern) | Where-Object { $_.Index -gt $relativeSpitIndex }

if ($remainingMatches.Count -eq 0) {
    Write-Host "Error: Could not determine split point" -ForegroundColor Red
    exit 1
}

$keepStartIndex = $remainingMatches[0].Index

# Split journal section
$toArchive = $journalSection.Substring(0, $keepStartIndex).Trim()
$toKeep = $journalSection.Substring($keepStartIndex).Trim()

# Preview what will be archived
Write-Host ""
Write-Host "Entries to archive:" -ForegroundColor Cyan
for ($i = 0; $i -lt $entriesToArchive; $i++) {
    $entryHeader = $journalMatches[$i].Value
    Write-Host "  - $entryHeader" -ForegroundColor DarkGray
}

if (-not $DryRun) {
    # Read existing archive (or create new)
    $archiveContent = ""
    if (Test-Path $archiveFile) {
        $archiveContent = Get-Content $archiveFile -Raw
    }
    else {
        # Create new archive file header
        $dateStamp = Get-Date -Format 'yyyy-MM-dd'
        $archiveContent = "# CyCOS Prime: Pulse Archive`r`n"
        $archiveContent += "*Complete historical record. Not loaded during stand-up unless explicitly needed for deep research.*`r`n`r`n"
        $archiveContent += "## Archive Policy`r`n"
        $archiveContent += "- **Created**: $dateStamp`r`n"
        $archiveContent += "- **Purpose**: Store journal entries older than $keepSessions sessions to reduce token consumption during stand-up`r`n"
        $archiveContent += "- **Curation**: Automatically managed by pulse_curator.ps1 during stand-down`r`n"
        $archiveContent += "- **Access**: On-demand for retrospectives, deep research, or historical context`r`n`r`n"
        $archiveContent += "---`r`n`r`n"
        $archiveContent += "## Archived Journal Entries`r`n`r`n"
    }

    # Append archived entries to archive file
    $archiveInsertPattern = '(?m)^## Archived Journal Entries\s*$'
    $archiveInsertMatch = [regex]::Match($archiveContent, $archiveInsertPattern)
    
    if ($archiveInsertMatch.Success) {
        $insertPoint = $archiveInsertMatch.Index + $archiveInsertMatch.Length
        $newArchiveContent = $archiveContent.Substring(0, $insertPoint) + "`r`n`r`n" + $toArchive + "`r`n" + $archiveContent.Substring($insertPoint)
    }
    else {
        # Fallback: append to end
        $newArchiveContent = $archiveContent + "`r`n`r`n## Archived Journal Entries`r`n`r`n" + $toArchive
    }

    # Write updated archive
    Set-Content -Path $archiveFile -Value $newArchiveContent -NoNewline

    # Write updated Pulse.md
    $newPulseContent = $preamble + "`r`n`r`n" + $toKeep
    Set-Content -Path $pulseFile -Value $newPulseContent -NoNewline

    Write-Host ""
    Write-Host "Curation complete!" -ForegroundColor Green
    Write-Host "  - Archived $entriesToArchive entries to PulseArchive.md" -ForegroundColor White
    Write-Host "  - Pulse.md now contains $keepSessions most recent sessions" -ForegroundColor White
    
    # Calculate token savings estimate (rough)
    $archivedBytes = [System.Text.Encoding]::UTF8.GetByteCount($toArchive)
    $estimatedTokens = [math]::Ceiling($archivedBytes / 4)
    Write-Host "  - Estimated token savings: ~$estimatedTokens tokens" -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "Dry run complete - no changes made" -ForegroundColor Magenta
}

Write-Host "===========================================" -ForegroundColor DarkGray

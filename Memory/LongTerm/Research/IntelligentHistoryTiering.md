# Intelligent History Tiering for Token Efficiency

**Purpose**: Maintain lean context for cross-system handoff while preserving complete historical record.

## The Problem

AI agents re-read entire context on every invocation. Large history files cause:
- **High token consumption** during stand-up (every session start)
- **Slower context loading** between Foundry-Prime and Foundry-Mobile
- **Wasted tokens** on old, irrelevant session details

## The Solution: Two-Tier History

### Active History (Pulse.md)
- **Contains**: Last 3 sessions only
- **Purpose**: Immediate context for cross-system handoff
- **Loaded**: Every stand-up (token-efficient)
- **Size**: ~2,000-3,000 tokens (vs 7,000+ before)

### Archive (PulseArchive.md)
- **Contains**: All sessions older than 3
- **Purpose**: Complete historical record for deep research
- **Loaded**: On-demand only (when explicitly needed)
- **Size**: Grows indefinitely without impacting stand-up

## How It Works

### Automatic Curation (Stand-Down)
```powershell
# Step 4 in stand-down.md
powershell -ExecutionPolicy Bypass -File "Agencies/Technical/Skills/pulse_curator.ps1"
```

The curator:
1. Counts journal entries in Pulse.md
2. Identifies entries older than the 3 most recent
3. Moves old entries to PulseArchive.md
4. Preserves chronological order
5. Reports token savings

### Manual Curation (When Needed)
```powershell
# Dry run to preview what would be archived
powershell -ExecutionPolicy Bypass -File "Agencies/Technical/Skills/pulse_curator.ps1" -DryRun

# Force curation manually
powershell -ExecutionPolicy Bypass -File "Agencies/Technical/Skills/pulse_curator.ps1"
```

## Token Savings

### Before Optimization
- **Pulse.md**: ~7,600 bytes (10 sessions)
- **Estimated tokens**: ~1,900 tokens
- **Loaded every stand-up**: Yes

### After Optimization
- **Pulse.md**: ~2,500 bytes (3 sessions)
- **Estimated tokens**: ~625 tokens
- **Savings per stand-up**: ~1,275 tokens (67% reduction)

### Cumulative Impact
- **Stand-ups per week**: ~10-15
- **Weekly savings**: ~12,750-19,125 tokens
- **Monthly savings**: ~51,000-76,500 tokens

## Cross-System Handoff

### What Gets Preserved (Active Pulse)
- **Current Context**: What you're working on right now
- **Immediate Next Steps**: What to do when you resume
- **Last 3 Sessions**: Recent decisions, wins, friction, and vibe

### What Gets Archived
- **Older Sessions**: Complete history for retrospectives
- **Deep Context**: Architectural insights, alternatives considered
- **Historical Decisions**: Why certain approaches were chosen

### Accessing Archive
When you need deep historical context:

```markdown
## Stand-Up Context Retrieval
1. Read ActiveState.md (current mission)
2. Read Pulse.md (last 3 sessions)
3. **If needed**: Read PulseArchive.md (full history)
4. Read Roadmap.md (current phase)
```

## Best Practices

### 1. Keep "The Pulse" Section Current
The "Current Context" and "Immediate Next Steps" sections should always reflect the latest state, regardless of how many sessions are in the journal.

### 2. Write Meaningful Journal Entries
Since only the last 3 are loaded during stand-up, make each entry count:
- **The Wins**: What worked
- **The Friction**: What didn't
- **The Vibe**: Overall session quality
- **Next Step**: Clear handoff to next session

### 3. Archive is Not a Backup
The archive is for **on-demand access**, not disaster recovery. Your Git repository is the source of truth.

### 4. Adjust Session Count if Needed
Currently set to 3 sessions. To change:

```powershell
# Edit pulse_curator.ps1
$keepSessions = 5  # Change from 3 to 5
```

## File Structure

```
Memory/LongTerm/Research/
├── Pulse.md                 # Active (last 3 sessions)
└── PulseArchive.md          # Archive (all older sessions)
```

## Integration with Workflows

### Stand-Up (Read)
```markdown
## 2. Context Retrieval
1. Read ActiveState.md
2. Read Pulse.md (last 3 sessions) ← Token-efficient
3. Read Roadmap.md
```

### Stand-Down (Write + Curate)
```markdown
## 1. Pulse Check
1. Open Pulse.md
2. Update "Current Context"
3. Add new journal entry
4. Run pulse_curator.ps1 ← Automatic archiving
```

## Troubleshooting

### Curator Not Archiving
- **Check**: Do you have more than 3 journal entries?
- **Verify**: Journal entries follow the pattern `### [YYYY-MM-DD | HH:MM | System] - Title`

### Need to Restore from Archive
```powershell
# Manually copy entries from PulseArchive.md back to Pulse.md
# Then adjust the curator's $keepSessions if needed
```

### Want Different Session Count
Edit `pulse_curator.ps1` and change `$keepSessions = 3` to your preferred number.

---

*Last Updated: 2026-02-15*  
*Part of CyCOS Token Efficiency Optimization Initiative*

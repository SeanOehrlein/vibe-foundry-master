# Terminal Execution Best Practices for Token Efficiency

**Purpose**: Minimize unnecessary terminal executions and token consumption in CyCOS workflows.

## Core Principles

### 1. Batch Over Individual
**Problem**: Running multiple small commands separately causes context switching overhead.

**Solution**: Group related commands into single scripts.

```powershell
# ❌ Token-Wasteful (3 separate executions)
git status
git add .
git commit -m "update"

# ✅ Token-Efficient (1 batched script)
powershell -File "Agencies/Technical/Skills/git_sync.ps1"
```

### 2. Selective Turbo Mode
**Problem**: `// turbo-all` can cause unnecessary auto-runs for exploratory commands.

**Solution**: Use `// turbo` selectively for critical, safe operations only.

```markdown
## Workflow Example

1. Check system health (manual review recommended)
   ```powershell
   npm test
   ```

// turbo
2. Sync environment (safe, deterministic)
   ```powershell
   powershell -File "Agencies/Technical/Skills/vibe_init.ps1"
   ```
```

### 3. Minimize Diagnostic Checks
**Problem**: Agents often run unnecessary status checks that consume "thinking" tokens.

**Solution**: Design workflows to trust previous steps and only verify critical checkpoints.

```markdown
# ❌ Token-Wasteful
1. Check if Git is installed
2. Check if repo exists
3. Check if branch is main
4. Run git pull

# ✅ Token-Efficient
1. Run git pull (will fail gracefully if issues exist)
```

### 4. Prefer Manual Review for Exploration
**Problem**: Auto-running exploratory or diagnostic commands wastes tokens on uncertain outcomes.

**Solution**: Set `SafeToAutoRun: false` for commands that:
- Explore unknown state
- Have uncertain outcomes
- Are for information gathering only

```powershell
# Exploratory - should NOT auto-run
Get-ChildItem -Recurse | Where-Object { $_.Length -gt 1MB }

# Deterministic - CAN auto-run
powershell -File "Agencies/Technical/Skills/pulse_curator.ps1"
```

## Token Savings Estimates

| Practice | Token Savings | Impact |
|----------|---------------|--------|
| Batch 5 commands into 1 script | ~200-400 tokens | High |
| Selective turbo (vs turbo-all) | ~100-300 tokens/session | Medium |
| Eliminate redundant checks | ~50-150 tokens/workflow | Medium |
| Manual review for exploration | ~100-200 tokens/task | Low-Medium |

## CyCOS Implementation

### Current Workflows
- **stand-up.md**: Uses `// turbo-all` appropriately (deterministic sync operations)
- **stand-down.md**: Uses `// turbo-all` appropriately (commit, push, curation)

### Recommended Pattern
For new workflows, use this decision tree:

```
Is the command:
├─ Deterministic + Safe? → // turbo
├─ Part of critical workflow? → // turbo
├─ Exploratory/Diagnostic? → Manual review
└─ Potentially destructive? → Manual review
```

## Best Practices Summary

1. **Batch related commands** into reusable scripts
2. **Use `// turbo` selectively**, not `// turbo-all` by default
3. **Trust previous steps** - avoid redundant verification
4. **Manual review for exploration** - auto-run only deterministic operations
5. **Design for efficiency** - every terminal call has token cost

---

*Last Updated: 2026-02-15*  
*Part of CyCOS Token Efficiency Optimization Initiative*

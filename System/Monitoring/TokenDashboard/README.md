# CyCOS Token Dashboard - README

## Overview
Security-first token usage monitoring for CyCOS operational intelligence. Built with **zero external dependencies** using only Node.js built-ins.

## Features
- **Real-time token monitoring** across Gemini, Claude, and GPT-OSS
- **5-hour rolling window tracking** with countdown timers
- **CSV logging** for operational analytics and research
- **Terminal UI** with ANSI escape codes (no web server, no attack surface)
- **Zero dependencies** - maximum security, minimal risk

## Quick Start

### View Current Status
```powershell
cd System/Monitoring/TokenDashboard
node src/status.js
```

### Launch Live Dashboard
```powershell
cd System/Monitoring/TokenDashboard
node src/index.js
```
Press `Ctrl+C` to exit.

## Architecture

### Security-First Design
- **No external dependencies** - Only Node.js built-ins
- **No network exposure** - Terminal-only interface
- **Append-only logging** - CSV files cannot be tampered with during operation
- **Minimal attack surface** - Simple, auditable codebase

### Components

**ui.js** - Terminal rendering with ANSI escape codes  
**csvLogger.js** - Append-only CSV logging  
**mockDataProvider.js** - Mock data for prototype (will be replaced with Antigravity API client)  
**index.js** - Main dashboard with auto-refresh  
**status.js** - Quick status check

## CSV Log Format

Location: `Memory/LongTerm/Analytics/token_usage.csv`

```csv
timestamp,model,thinking_tokens,input_tokens,output_tokens,total_tokens,conversation_id,session_id,system
2026-02-15T12:00:00Z,Gemini 2.0 Flash Thinking,1500,800,400,2700,abc123,session-001,Foundry-Prime
```

## Next Steps

### Phase 2: Antigravity API Integration
1. Discover Antigravity Language Server API endpoints
2. Replace `mockDataProvider.js` with real API client
3. Parse `.gemini` logs for thinking token isolation
4. Implement quota refresh window calculations

### Phase 3: Workflow Integration
1. Add `/token-status` workflow trigger
2. Optional dashboard launch in stand-up
3. Integrate with ActiveState.md

## Development

### Test Mock Data
```powershell
node src/status.js
```

### Run Live Dashboard
```powershell
node src/index.js
```

### View CSV Logs
```powershell
type Memory\LongTerm\Analytics\token_usage.csv
```

---

**Status**: Prototype Complete ✅  
**Dependencies**: 0  
**Security**: Maximum

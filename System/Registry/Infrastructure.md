# CyCOS Infrastructure & Operational Manual

## 1. System Identities (Thematic)
To ensure clarity during multi-device synchronization, we recognize two distinct AI instances:
- **Foundry-Prime** (Desktop): The primary high-compute terminal.
- **Foundry-Mobile** (Laptop): The portable development unit.

## 2. Hardware & Pathing
- **OS**: Windows
- **System Root**: `C:\CyCOS` (Legacy: `C:\1. SanEnso Vibe Coding`)
- **Status**: Sovereign Operational

## 3. Source of Truth: Directory Structure
All instances must reconcile against this definitive structure:

```text
C:\1. SanEnso Vibe Coding\
├── .agent/
│   └── workflows/          # Standard Operating Procedures (stand-up/down)
├── 1. Projects/
│   └── sanenso-personal-ai-assistant/
│       ├── Manager/        # Node.js Orchestrator
│       ├── Execution/      # Python Inference Layer
│       ├── Memory/         # Episodic & Semantic Storage
│       └── Skills/         # Atomic Capabilities
├── 2. Library/
│   ├── 1. Skills/          # Global Agent Skills
│   ├── 2. Instructions/    # Guides & Roadmap
│   └── 4. Research/        # Handoff Memos, Journal, & Analysis
├── .clinerules             # Behavioral Triggers
└── .gitignore              # Version Control Exclusion
```

## 4. Sync Workflow: "The Vibe Coder Protocol"
We adhere to the following core principles:

### A. Architect First
- Never write code without first explaining the logic in a "Plan" block.
- Verify the plan before execution.

### B. Device Handoff
- Every session **must** end with a `stand-down` and start with a `stand-up`.
- The `Handoff_Memo.md` is the primary bridge between **Foundry-Prime** and **Foundry-Mobile**.

### C. Security Check
- Always check for potential security triggers before running automated scripts.

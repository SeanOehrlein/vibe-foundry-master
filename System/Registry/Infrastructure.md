# CyCOS Infrastructure & Operational Manual

## 1. System Identities (Thematic)
To ensure clarity during multi-device synchronization, we recognize two distinct AI instances:
- **Foundry-Prime** (Desktop): The primary high-compute terminal.
- **Foundry-Mobile** (Laptop): The portable development unit.

## 2. Hardware & Pathing
- **OS**: Windows
- **System Root**: `C:\CyCOS` (Legacy: `C:\1. SanEnso Vibe Coding`)
- **Status**: Sovereign Operational

## 3. Sovereign Quad-Plane Structure
All instances must reconcile against the Sovereign Quad-Plane structure:

```text
C:\CyCOS\ (SanEnso Vibe Coding)
├── System/
│   ├── Core/               # Manager (Node) + Execution (Python)
│   ├── Policy/             # Universal Law (System_Policy.md)
│   └── Registry/           # Roadmap, Infrastructure, States
├── Agencies/
│   └── Technical/          # Skills, Manifests, Technical Passport
├── Memory/
│   ├── LongTerm/           # Research, Pulse, History
│   └── ShortTerm/          # Logs, Ephemeral State
└── Foundry/
    └── Active_Workspaces/  # Ephemeral Project Workspaces
```

## 4. Sync Workflow: "The Sovereign Protocol"
We adhere to the following core principles:

### A. Architect First
- Never write code without first explaining the logic in a "Plan" block.
- Verify the plan before execution.

### B. Device Handoff
- Every session **must** end with a `stand-down` and start with a `stand-up`.
- The `Pulse.md` is the primary bridge between **Foundry-Prime** and **Foundry-Mobile**.

### C. Security Check
- Always check for potential security triggers before running automated scripts.
- Verify the `System/Registry/active_state.json` before any mounting operation.

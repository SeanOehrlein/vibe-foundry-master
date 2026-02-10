# Lab Manual: Infrastructure & Workflow

## 1. Hardware
- **System**: Windows Workstation
- **OS**: Windows (Specific version info to be added)
- **Status**: Operational

## 2. Folder Structure
The file system is organized to separate active work from reference materials:

- **1. Projects/**: Contains all active coding projects.
    - Each project folder **must** have a `README.md`.
- **2. Library/**: The knowledge base and toolkit.
    - **1. Skills/**: Reusable code snippets and specialized agent capabilities.
    - **2. Instructions/**: Context, guides, and this Lab Manual.
    - **3. Workflows/**: Standard operating procedures (SOPs).

## 3. Tool Stack
- **Operating System**: Windows
- **Shell**: PowerShell
- **Version Control**: Git / GitHub
    - *Status*: Git command not currently detected in the active shell. Configuration needed.
- **AI Assistant**: Antigravity (Google Deepmind)
    - Role: Pair programmer, architect, and guide.

## 4. Sync Workflow: "The Vibe Coder Protocol"
We adhere to the following core principles for all development:

### A. Architect First
- Never write code without first explaining the logic in a "Plan" block.
- Verify the plan before execution.

### B. Explain the 'Why'
- When suggesting tools or libraries, briefly explain why they are the best choice for the context.

### C. Security Check
- Always check for potential security triggers (e.g., suspicious file movements) before running scripts.

### D. Project Management
- **Documentation**: Code must be documented for human readability.
- **Naming**: Use descriptive variable names (no `x` or `temp`).
- **Scalability**: If a task becomes too large, break it down into sub-projects/tasks.

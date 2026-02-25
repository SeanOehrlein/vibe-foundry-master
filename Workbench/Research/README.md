# Research Lab Protocol & Safety
**Mission**: A quarantined environment for analyzing ("dissecting") external repositories.

## 1. The Airlock Rule
*   **NO** external code leaves this directory until it has been:
    1.  Analyzed by the Scout (Recon Agent).
    2.  Audited by the Surgeon (Dissection Agent).
    3.  Explicitly "Exported" by the Chief of Staff.

## 2. Directory Structure
*   `Foundry/Research/Sandbox/`: Temporary "operating table" for cloned repos.
*   `Foundry/Research/Vats/`: Long-term storage for "Specimens" (repos we are actively studying over time).
*   `Foundry/Research/Library/`: Extracted patterns, prompts, and skills (The "Clean" Zone).

## 3. Dissection Process
1.  **Clone**: `repo_dissect.py` clones repo to `Sandbox/`.
2.  **Study**: The Agent analyzes the code without executing it.
3.  **Extract**: Useful snippets are copied to `Library/`.
4.  **Incinerate**: The `Sandbox` is wiped clean after the session (unless moved to `Vats`).

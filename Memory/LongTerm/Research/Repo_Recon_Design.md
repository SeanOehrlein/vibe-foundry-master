# Repo Recon: Design Specification

**Mission**: Learn from the best to accelerate CyCOS development.
**Role**: A specialized capability of the **Research Agency**.

## 1. Core Objectives
We do not just "copy code." We analyze **patterns** to improve our own architecture.
*   **Vibe Check**: How does the developer *think*? (Structure, naming, organization).
*   **Element Extraction**: Identify reusable components (MCPs, Hooks, Prompts).
*   **Best Practices**: Audit Testing and Security standards.

## 2. Analysis Vectors (The Scanners)
The Repo Recon agent must scan for the following dimensions:

### A. Structure & Vibe
*   **Tree Visualization**: ASCII representation of the project skeleton.
*   **Naming Conventions**: How are modules named? (e.g., `feature/` vs `src/feature`).
*   **Modularity**: Is it monolithic or micro-services?

### B. The "Hidden" Intelligence
*   **Prompts**: Search for `.yaml`, `.json` or code strings containing "System Message", "User Query", etc.
*   **AI Patterns**: Usage of `LangChain`, `OpenAI`, `Torch`.
*   **Hooks**: Search for Event-Driven patterns (`on_event`, `signal`, `webhook`).
*   **MCPs**: Search for `mcp.json` or Model Context Protocol definitions.

### C. Engineering Rigor
*   **Testing**:
    *   Framework detection (`pytest`, `unittest`).
    *   Coverage analysis (is there a `coverage` config?).
    *   Test Types (Unit vs. Integration).
*   **Security**:
    *   `SECURITY.md` existence.
    *   Deep scan for hardcoded secrets (Entropy checks).
    *   Input validation patterns.
*   **CI/CD**:
    *   Analysis of `.github/workflows` to understand the *build pipeline*.

## 3. The Output: Recon Report
Every analysis generates a **Recon Report** (`recon_<repo_name>.md`) in `Foundry/Incoming`.
*   **Executive Summary**: "Should we learn from this?"
*   **Scorecard**: Ratings for Security, Testing, Style.
*   **Key Learnings**: "They handle error logging in a way we should adopt."
*   **Action Items**: "Copy the `scripts/setup.sh` pattern."

## 4. Operational Workflow: "Drop & Go"
1.  **Trigger**: User provides a URL (e.g., `github.com/pallets/flask`).
2.  **Stage 1: Recon (The Scout)**
    - *Action*: Scans public API. Does NOT clone.
    - *Output*: `recon_report.md`.
    - *Decision Point*: "Safe to Dissect?" (License check, Security check).
3.  **Stage 2: Dissection (The Surgeon)**
    - *Action*: **Clones** the repo to `Foundry/Research/Sandbox/`.
    - *Task*: Extracts specific patterns (e.g., "Copy their testing setup").
    - *Output*: Saves structured patterns to `Foundry/Research/Library/`.

## 5. Constraint Checklist
*   [ ] **License Check**: MUST identify License (MIT/Apache = Go; GPL = Caution).
*   [ ] **Public Only**: Initially scoped to public GitHub repositories.
*   [ ] **Quarantine**: All dissection happens in `Foundry/Research`. No external code touches `System/Core` directly.

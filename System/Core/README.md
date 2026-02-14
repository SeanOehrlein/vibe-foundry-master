# CyCOS Core Orchestrator

## Overview
The **CyCOS Core Orchestrator** is the central intelligence engine of the Sovereign Agentic Operating System. It leverages a hybrid architecture to combine the event-driven performance of Node.js with the rich AI/ML ecosystem of Python.

## Architecture
This project follows the **Project Blueprint: AI Assistant Core** standard.

### 1. Manager (Node.js/TypeScript)
*   **Role**: System orchestrator, UI handler, and event loop manager.
*   **Responsibility**: Delegates heavy compute tasks to the Execution Layer and manages user interactions.

### 2. Execution (Python)
*   **Role**: Data processing and AI inference engine.
*   **Responsibility**: Handles LLM interactions, vector database queries (RAG), and complex data analysis.

### 3. Memory
*   **Episodic**: Session-based context.
*   **Semantic**: Long-term persistent storage (SQLite/Vector DB).

### 4. Skills
*   **Atomic Capabilities**: Modular features registered via `manifest.json`.
*   **Hot-Swappable**: Plugins that can be added or updated independently.

## Setup
### Manager (Node.js)
1.  Navigate to `Manager/`.
2.  Run `npm install`.
3.  Start with `npm start`.

### Execution (Python)
1.  Navigate to `Execution/`.
2.  Create a virtual environment: `python -m venv venv`.
3.  Activate environment and install deps: `pip install -r requirements.txt`.

## Usage
*   Start the System Manager to initialize the orchestrator.
*   The Manager will automatically spawn the Execution layer subprocess.

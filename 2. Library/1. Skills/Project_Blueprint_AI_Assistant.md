# Blueprint: Modular AI Assistant Architecture

## 1. Multi-Language Orchestration (The Bridge)
- **Core Manager (Node.js/TypeScript)**: Handles system events, user interface, and high-level task delegation.
- **Execution Layer (Python)**: Handles LLM interactions, data processing, and specialized AI libraries.
- **Communication**: Inter-process communication via JSON-RPC or a lightweight FastAPI layer to ensure decoupled scalability.

## 2. Memory Architecture (Stateful Logic)
- **Episodic Memory**: Volatile short-term context stored in-session.
- **Semantic Memory**: Persistent long-term storage using a local SQLite (for speed) or Vector Database (for RAG).
- **Goal Alignment (TELOS)**: Explicit storage of User Directives and Long-term Objectives to ensure all actions align with user intent.
- **Pattern**: Always query semantic memory and goals before executing a task.

## 3. Atomic Skill Registration
- Every capability must be an independent directory.
- Each skill must contain a `manifest.json` describing its inputs, outputs, and dependencies.
- Skills are "hot-swappable" and should not have hard dependencies on other skills.

## 4. Hooks System (Event-Driven)
- **Concept**: Automation workflows triggered by system events (file changes, time, webhooks).
- **Implementation**: Located in `Manager/Hooks/`. Node.js event listeners that trigger specific Skills or Plans.

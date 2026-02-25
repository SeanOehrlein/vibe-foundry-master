# 🕵️ Scout Report: OpenClaw

| Metric | Score |
| :--- | :--- |
| **Safety** | **HIGH** |
| **Value** | **HIGH** |
| **Verdict** | **DISSECT** |

## Summary
OpenClaw appears to be a **locally-hosted, personal AI assistant framework** written primarily in **TypeScript (Node.js)**. It is designed for **privacy and cost-efficiency**, supporting local models via `ollama` and `node-llama-cpp`, which aligns directly with the "Free is Better" objective. It uses a "Gateway" architecture (WebSocket) to manage multiple messaging channels (Discord, Telegram, WhatsApp) and local execution nodes.

## Tech Stack Analysis
*   **Runtime**: Node.js v22+ (TypeScript).
*   **Package Manager**: `pnpm` (Core infrastructure).
*   **Inference**:
    *   **Cloud**: Anthropic, OpenAI (Optional).
    *   **Local**: `ollama`, `node-llama-cpp` (Core functionality for "free" use).
*   **Architecture**:
    *   **Gateway**: Central WebSocket server (18789).
    *   **Agents**: RPC-based processes (`pi-agent-runtime`).
    *   **Channels**: Extensible plugins for messaging apps.
    *   **Database**: SQLite (via `sqlite-vec` for vector search).

## "Two More Things" - Tech Stack Implications
The user asked: *"Do we need to make changes or updates to our tech stack now that we have more online...free is better?"*

**Analysis based on OpenClaw Findings:**
1.  **Shift to TypeScript/Node for Agents?**:
    *   CyCOS currently uses **Python** for backend agents (`Recon_Unit`, `Technical/Tools`) and **Node.js** for the dashboard (`System/Interface`).
    *   OpenClaw is **pure TypeScript**. This offers tighter integration with the web-based `Dashboard` (Next.js) and `Gateway`.
    *   **Recommendation**: Consider migrating lighter agent logic (Scouts, Watchers) to TypeScript/Node to leverage the same runtime as the Dashboard, reducing context switching and simplifying deployment. Heavy lifting (ML/Data Science) can remain in Python.

2.  **Adopting the "Gateway" Pattern for Free Models**:
    *   OpenClaw uses a **Local Gateway** to abstract model providers. This allows swapping cloud APIs for local Ollama instances seamlessly.
    *   **Action**: Create a `System/Core/Gateway` (Node.js) similar to OpenClaw's, or adapt OpenClaw itself as the CyCOS runtime. This would enable:
        *   **Zero-Cost Inference**: Route "Thinking" tasks to a local Llama 3/Mistral model via Ollama.
        *   **Unified API**: The Dashboard talks to the Gateway, not directly to LLM providers.

3.  **Docker/Containerization**:
    *   OpenClaw emphasizes Docker for consistent environments (`Dockerfile`, `docker-compose.yml`).
    *   CyCOS is currently running bare-metal scripts.
    *   **Recommendation**: As we add more services (Dashboard, Server, Agents), wrapping them in Docker Compose (like OpenClaw) will stabilize the "online" stack.

## Key Files for Extraction (Surgeon Targets)
*   **Architecture**: `src/gateway/` (The control plane logic).
*   **Local Inference**: `src/models/` (How they handle Ollama/LlamaCPP integration).
*   **Skills**: `skills/` (Pre-built tools we can adapt).
*   **Agent Protocol**: `docs/concepts/architecture.md` (Understanding their RPC model).

---
*Scouted by Gemini 1.5 Flash via CyCOS Recon Unit (Manual Override)*

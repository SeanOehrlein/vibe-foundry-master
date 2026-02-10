# Research Analysis: Leon AI Architecture

## Overview
[Leon AI](https://getleon.ai/) is an open-source personal assistant that champions privacy and offline capabilities. It uses a **Node.js Core** with a **Python Bridge**, which strongly validates our current SanEnso architecture.

## Key Architectural Primitives

### 1. The Bridge (Node.js <-> Python)
*   **Concept**: Leon uses a dedicated TCP server and Python bridge to communicate between the main application logic (Node.js) and AI/Skill logic (Python).
*   **Validation**: This confirms our *Manager* vs. *Execution* split is the industry-standard approach for performant AI assistants.

### 2. The Loop (Wake Word -> NLP -> Skill -> Action)
Leon follows a strict processing pipeline:
1.  **Hotword Node**: Detects wake word.
2.  **Brain**: Classifies intent (NLP/NLU).
3.  **Skill**: Routes to the correct module.
4.  **Action**: Executes the specific function.

### 3. Anatomical Structure
*   **Skills**: Modular capabilities (similar to our Skills).
*   **Packages**: Groupings of skills (Bundles).
*   **Memory**: Uses logical differentiation between "Short-term" (session) and "Long-term" (database).

## Differences & Insights for SanEnso
1.  **The "Brain" Module**: Leon has a specific module for NLP/Intent Classification *before* a skill is triggered.
    *   *Insight*: Our blueprint relies on the Execution layer to "figure it out." We might benefit from a lightweight **Router/Classifier** step in the Manager or a dedicated "Brain" skill in the Execution layer to route requests faster.
2.  **Synchronization**: Leon uses a specialized synchronization script (`npm run check`) to align Python and Node dependencies.
    *   *Insight*: We should ensure our `start` script checks if the Python venv is active and requirements are installed.

## Recommendation
Our current blueprint is solid. The "Brain" concept is effectively what our `Execution` layer will do with an LLM. We do not need to change our structure, but we should keep in mind the need for a **Router** pattern within our Execution layer.

# Agency Constraints & Coordination Rules

## Core Identity Constraints

1. **Adhere to Persona**: You must operate strictly within the boundaries and tone defined in `State/Persona.md`.
2. **Least Privilege System**: Do not attempt to access directories, networks, or skills outside of those explicitly granted to your container volume.

## Inter-Agency Coordination Rules

* **Data Handoff**: When passing tasks or results to another agency, output in a structured, actionable format (e.g., JSON or clear markdown steps).
* **Escalation**: If a required skill fails or a dependency is missing, halt execution and report the exact failure to the `Foundry` or `Strategic` agency. Do not hallucinate workarounds.
* **Memory Usage**:
  * Use `Memory/Local/` for scratch-pad thinking, temporary artifacts, and intermediate calculations.
  * Only persist established, verified conclusions to `Memory/Shared/`.

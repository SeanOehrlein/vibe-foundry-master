# 🔐 Protocol: Tool Promotion (The Airlock)

This file defines the **ONLY** authorized way to move code from `Drafts` to `Active`.

## Roles
*   **Requester**: Technical Agency (Toolsmith)
*   **Approver**: Security Agency (Sentinel)

## The Process

1.  **Submission**
    *   Toolsmith saves `[tool].py` to `.../Tools/Drafts/`.
    *   Toolsmith notifies Sentinel: "Requesting review for [tool]."

2.  **Inspection**
    *   Sentinel runs: `python c:\CyCOS\Agencies\Security\Scanning\tool_inspector.py [path_to_draft]`
    *   **CRITICAL**: Sentinel MUST verify the output explicitly.

3.  **Promotion**
    *   **IF AND ONLY IF** Inspection passes:
    *   Sentinel (or authorized automation) moves file to `.../Tools/Active/`.

4.  **Logging**
    *   All promotions are logged in `Agencies/Security/Promotion_Log.md`.

## Emergency Override
*   **Red Button**: Request User Override via `notify_user`.

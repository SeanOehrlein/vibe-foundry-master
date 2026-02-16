# LifeOS: The "2.5 Layer" Obsidian Architecture

**Source**: User "Brainstorming" / External Spec.
**Objective**: A unified knowledge ecosystem for Health Exec, Doctoral Student, Officer Transition, and Life.

## I. Core Philosophy
*   **Structure**: Hybrid "Johnny.Decimal" (Domains) + "PARA-Lite" (Projects).
*   **Depth**: "2.5 Layers". Flat is risky for ADHD. Deep is high-friction.
    *   Layer 1: Domain (10_HealthExec).
    *   Layer 2: Standard Type (Inbox, Notes, Logs, projects, Assets).
    *   Layer 2.5: Project Exception (Sub-folders allowed *only* in active Projects).

## II. The Folder Spec
```text
/00_System
  /Inbox          (Global Entry)
  /Dashboards     (Role Hubs)
  /Templates      (Blueprints)
  /Rules          (SOPs)
  /ContextPacks   (AI Grounding)
  /Assets

/10_HealthExec    (Domain)
/20_Business      (Domain)
/30_Doctoral      (Domain)
/40_MilitaryTransition (Domain)
/50_CareerStrategy (Domain)
/60_HomeRemodel   (Domain)
/70_Wellness      (Domain)
/80_Family        (Domain)

/90_Archive
/_attachments
```

## III. Governance & ADHD Rules
1.  **Single Capture**: Everything hits `/00_System/Inbox` first.
2.  **Daily Dump**: 5 mins. Move from Global Inbox to Domain Inbox or Trash.
3.  **Mandatory Metadata**:
    *   `type`: (inbox, literature, evergreen, meeting, decision, project, contextpack)
    *   `area`: (10_HealthExec, etc.)
    *   `status`: (draft, active, parked, done)
4.  **Shadow Links**: "How-to" guides kept in `/Rules`.

## IV. Agentic Integration (The Link to CyCOS)
*   **Context Packs**: Curated Markdown files in `00_System/ContextPacks/` that summarize status for AI Agents.
    *   *CyCOS Implications*: These are the "Read Only" files CyCOS should consume to understand User Context.
*   **MCP**: Model Context Protocol to bridge Obsidian to Agents.
*   **Google Drive**: Used for sync (Strategic Uplink).

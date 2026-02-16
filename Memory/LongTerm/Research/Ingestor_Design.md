# Smart Ingestor Design: The "Flash Filter"

**Objective**: Automatically classify, extract, and route incoming raw data using low-cost AI models.

## 1. The Funnel (Getting Data In)
We need to minimize friction. "If it takes > 3 taps, I won't do it."

### A. iOS Shortcut (The "Red Phone")
*   **Mechanism**: A Shortcut on your iPhone Home Screen.
*   **Action**: Dictate or Type -> Appends text to `G:\My Drive\00_CYCOS_BRAIN\Incoming\quick_note.txt` (or separate timestamped files).
*   **Pros**: Free, Instant, Native. No third-party API keys.
*   **Cons**: Requires initial setup on phone.

### B. Email Bridge (The "Mailbag")
*   **Mechanism**: A dedicated Gmail folder (Label: `To_CyCOS`).
*   **Action**: Apps Script (in Google) auto-saves attachment/body to `Incoming`.
*   **Use Case**: Forwarding newsletters, bills, or "read later" PDFs.

## 2. The Filter (Processing Data)
The `process_strategy.js` Watcher runs this logic *before* archiving.

### The "Flash" Extraction Matrix
We send the raw text to **Gemini 1.5 Flash** (Cheap, Fast) with this prompt:

> "Analyze this input. It may contain multiple distinct items (Tasks, Ideas, Events).
> Extract them into a JSON list:
> {
>   'items': [
>     { 'type': 'TASK', 'content': 'Buy milk', 'priority': 'High' },
>     { 'type': 'IDEA', 'content': 'Research Quantum Physics', 'context': '...' },
>     { 'type': 'EVENT', 'content': 'Dentist at 2pm', 'date': '2026-02-20' },
>     { 'type': 'URL', 'content': 'https://github.com/...', 'description': 'Repo to scan' }
>   ]
> }"

### Routing Logic (The Splitter)
The script iterates through the list and routes each item:
1.  **TASK** -> Append to `Agencies/Operations/Inbox.md` (or Todoist API).
2.  **IDEA** -> Append to `Memory/LongTerm/Pulse.md`.
3.  **EVENT** -> Notify `Executive_Assistant` (to update Calendar).
4.  **URL** -> Trigger **Repo Recon** (Phase 7).
5.  **UNCLEAR** -> Save to `brain_dump_review.md` for manual review.

## 3. Token Economics
*   **Input**: A 500-word brain dump ~ 700 tokens.
*   **Cost**: Negligible with Flash.
*   **Efficiency**: We do NOT use the "Big Brain" (Pro/Ultra) for sorting operations.

## 4. Implementation Steps
1.  **Upgrade Watcher**: Add API call to Gemini Flash.
2.  **Create Routing Functions**: `appendToInbox()`, `updatePulse()`, etc.
3.  **Build iOS Shortcut**: Provide screenshots/steps for User.

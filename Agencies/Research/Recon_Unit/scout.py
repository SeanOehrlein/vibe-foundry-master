import os
import sys
from typing import List, Any
import json
import base64
from datetime import datetime
from github import Github
import google.generativeai as genai
from dotenv import load_dotenv

# Load Environment
load_dotenv(dotenv_path='c:\\CyCOS\\System\\Core\\Manager\\.env')

# Config
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
REPORTS_DIR = 'c:\\CyCOS\\Foundry\\Research\\Reports'

# Initialize Clients
if GITHUB_TOKEN:
    from github import Auth
    auth = Auth.Token(GITHUB_TOKEN)
    g = Github(auth=auth)
else:
    print("Warning: No GITHUB_TOKEN. Rate limits will be low.")
    g = Github()

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
else:
    print("Error: GEMINI_API_KEY is required for the Scout.")
    sys.exit(1)

def analyze_repo(repo_url):
    try:
        # 1. Parse URL
        repo_name = repo_url.replace('https://github.com/', '').strip('/')
        print(f"[*] Scouting Target: {repo_name}")

        # 2. Fetch Metadata (API Only - No Clone)
        repo = g.get_repo(repo_name)
        
        # Get Key Files (Content)
        try:
            readme = repo.get_readme().decoded_content.decode('utf-8')
        except:
            readme = "No README found."
        
        # Get File Structure (Tree)
        contents: List[Any] = repo.get_contents("")
        tree: List[str] = []
        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path))
            else:
                tree.append(file_content.path)
            
            # Limit tree size for Context
            if len(tree) > 200:
                break

        # 3. Construct Context for Flash
        context = f"""
        TARGET: {repo_name}
        DESCRIPTION: {repo.description}
        LANGUAGE: {repo.language}
        STARS: {repo.stargazers_count}
        
        FILE TREE (Top 200):
        {json.dumps(tree[:200], indent=2)} # type: ignore
        
        README SUMMARY (First 2000 chars):
        {readme[:2000]}...
        """

        # 4. Flash Analysis
        print("[*] Sending Intel to Gemini Flash...")
        prompt = """
        You are the CyCOS Scout. Analyze this repository metadata.
        
        Your Mission:
        1. Determine if this repo is SAFE (check for malicious indicators in file names).
        2. Determine if this repo is VALUABLE (does it contain useful patterns/tools?).
        3. Identify the KEY FILES that the 'Surgeon' agent should inspect later.
        
        Output JSON ONLY:
        {
            "safety_score": 0-100,
            "value_score": 0-100,
            "verdict": "DISSECT" or "IGNORE",
            "summary": "Brief explanation",
            "key_files": ["list", "of", "paths"],
            "risk_flags": ["list", "of", "risks"]
        }
        """
        
        response = model.generate_content(prompt + context)
        analysis = json.loads(response.text.replace('```json', '').replace('```', ''))

        # 5. Generate Report
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        report_path = os.path.join(REPORTS_DIR, f"RECON_{repo_name.replace('/', '_')}_{timestamp}.md")
        
        markdown_report = f"""# 🕵️ Scout Report: {repo_name}

| Metric | Score |
| :--- | :--- |
| **Safety** | {analysis['safety_score']}/100 |
| **Value** | {analysis['value_score']}/100 |
| **Verdict** | **{analysis['verdict']}** |

## Summary
{analysis['summary']}

## Risk Assessment
{json.dumps(analysis['risk_flags'], indent=2)}

## Surgeon Instructions
**Recommended Files for Dissection:**
{json.dumps(analysis['key_files'], indent=2)}

---
*Scouted by Gemini 1.5 Flash via CyCOS Recon Unit*
"""

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(markdown_report)

        print(f"[+] Report Generated: {report_path}")
        # 6. Notify Operations (The Queue)
        inbox_path = 'C:\\CyCOS\\Agencies\\Operations\\Inbox.md'
        task_line = f"- [ ] **Intelegence Brief**: Review Scout Report for [{repo_name}]({report_path}). Approve Surgeon? <!-- id: {int(datetime.now().timestamp())} -->\n"
        
        try:
            with open(inbox_path, 'a', encoding='utf-8') as f:
                f.write(task_line)
            print(f"[+] Inbox Notified: Added task to {inbox_path}")
        except Exception as e:
            print(f"[!] Inbox Notification Failed: {e}")

        return report_path

    except Exception as e:
        import traceback
        print(f"[!] Scout Failed: {e}")
        traceback.print_exc()
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scout.py <github_url>")
    else:
        analyze_repo(sys.argv[1])

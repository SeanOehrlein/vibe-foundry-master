import os
import sys
from typing import List
import json
from datetime import datetime
from github import Github, Auth
from dotenv import load_dotenv

# Load Environment
load_dotenv(dotenv_path='c:\\CyCOS\\System\\Core\\Manager\\.env')

# Config
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
SANDBOX_DIR = 'c:\\CyCOS\\Foundry\\Research\\Sandbox'

# Ensure Dirs
os.makedirs(SANDBOX_DIR, exist_ok=True)

# Initialize Clients
if GITHUB_TOKEN:
    auth = Auth.Token(GITHUB_TOKEN)
    g = Github(auth=auth)
else:
    print("Warning: No GITHUB_TOKEN. Surgeon might be rate limited.")
    g = Github()

def fetch_surgical_context(repo_url: str, target_files: List[str]):
    try:
        # 1. Parse URL/Name
        repo_name = repo_url.replace('https://github.com/', '').strip('/')
        safe_name = repo_name.replace('/', '_')
        print(f"[*] Surgeon Target: {repo_name}")

        # 2. Fetch Content (API Mode)
        print("[*] Fetching file contents (API Mode - No Binary Execution)...")
        
        repo = g.get_repo(repo_name)
        file_contents = {}
        
        for file_path in target_files:
            try:
                content_file = repo.get_contents(file_path)
                # Handle potential base64 encoding or raw string
                decoded = content_file.decoded_content.decode('utf-8')
                file_contents[file_path] = decoded
                print(f"    [+] Read: {file_path}")
            except Exception as e:
                print(f"    [!] Failed to read {file_path}: {e}")

        if not file_contents:
            print("[!] No files retrieved. Aborting.")
            return

        # 3. Assemble Context for Antigravity Analysis
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        raid_file_path = os.path.join(SANDBOX_DIR, f"RAID_{safe_name}_{timestamp}.md")
        
        with open(raid_file_path, 'w', encoding='utf-8') as f:
            f.write(f"# Surgical Context: {repo_name}\n")
            f.write(f"**Date**: {timestamp}\n")
            f.write(f"**Source**: {repo_url}\n\n")
            f.write("---\n")
            
            for fpath, fcontent in file_contents.items():
                f.write(f"\n## FILE: {fpath}\n")
                f.write("```\n")
                f.write(fcontent)
                f.write("\n```\n")

        print(f"[+] Surgical Context Saved: {raid_file_path}")
        print("[*] READY for Antigravity Analysis.")
        return raid_file_path

    except Exception as e:
        import traceback
        print(f"[!] Surgeon Failed: {e}")
        traceback.print_exc()
        return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python surgeon.py <github_url> <file_path_1> <file_path_2> ...")
        # Example: python surgeon.py https://github.com/user/repo src/main.py README.md
    else:
        url = sys.argv[1]
        t_files = sys.argv[2:] # type: ignore
        fetch_surgical_context(url, t_files)

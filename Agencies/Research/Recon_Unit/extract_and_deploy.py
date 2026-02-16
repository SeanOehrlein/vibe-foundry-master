import re
import json
import subprocess
import sys
import os

report_path = r'C:\CyCOS\Foundry\Research\Reports\RECON_agent0ai_agent-zero_2026-02-16_13-10.md'

try:
    if not os.path.exists(report_path):
        print(f"Report not found: {report_path}")
        sys.exit(1)

    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the list. It's usually at the end.
    # Look for the section header
    tag = "**Recommended Files for Dissection:**"
    if tag not in content:
        print("Could not find targets tag.")
        sys.exit(1)
        
    # Extract everything after the tag
    snippet = content.split(tag)[1]
    
    # Find the first '[' and last ']'
    start = snippet.find('[')
    end = snippet.rfind(']')
    
    if start == -1 or end == -1:
        print("Could not find JSON list delimiters.")
        sys.exit(1)
        
    json_str = snippet[start:end+1]
    targets = json.loads(json_str)
    
    print(f"Targets Identified: {targets}")
    
    # Run Surgeon
    cmd = ['python', r'c:\CyCOS\Agencies\Research\Recon_Unit\surgeon.py', 'https://github.com/agent0ai/agent-zero'] + targets
    subprocess.run(cmd, check=True)

except Exception as e:
    print(f"Extraction Failed: {e}")

import os
import re

raid_path = r'C:\CyCOS\Foundry\Research\Sandbox\RAID_agent0ai_agent-zero_2026-02-16_13-33.md'
output_dir = r'C:\CyCOS\Foundry\Research\Sandbox\AgentZero_Analysis'

if not os.path.exists(raid_path):
    print("RAID file not found.")
    exit(1)

with open(raid_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Split by file headers
# Pattern: ## FILE: path/to/file.py
# then ``` ... ```
pattern = r'## FILE: (.*?)\n```(.*?)```'
matches = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(matches)} files.")

for filename, file_content in matches:
    # Flatten directory structure for analysis convenience
    clean_name = filename.replace('/', '_').replace('\\', '_')
    out_path = os.path.join(output_dir, clean_name)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(file_content)
    
    print(f"Extracted: {clean_name}")

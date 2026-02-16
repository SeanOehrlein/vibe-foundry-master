import re

raid_path = r'C:\CyCOS\Foundry\Research\Sandbox\RAID_agent0ai_agent-zero_2026-02-16_13-15.md'

with open(raid_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract agent.py content
agent_match = re.search(r'## FILE:.*?agent\.py\n```(.*?)```', content, re.DOTALL)
if agent_match:
    print("--- AGENT.PY SNIPPET ---")
    print(agent_match.group(1)[:2000]) # First 2000 chars to see imports and class def

# Extract utility/tools content if available (looking for patterns)
# The file list was ['agent.py', 'models.py', '...']
models_match = re.search(r'## FILE:.*?models\.py\n```(.*?)```', content, re.DOTALL)
if models_match:
    print("\n--- MODELS.PY SNIPPET (Tool Definition) ---")
    print(models_match.group(1)[:2000])

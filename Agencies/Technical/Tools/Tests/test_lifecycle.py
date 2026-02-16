import os
import shutil
import sys

# Add directory to path to find modules
sys.path.append(r'c:\CyCOS\Agencies\Technical\Tools')

from tool_inspector import ToolInspector
from skill_loader import SkillLoader

drafts_dir = r'c:\CyCOS\Agencies\Technical\Tools\Drafts'
active_dir = r'c:\CyCOS\Agencies\Technical\Tools\Active'

inspector = ToolInspector()
loader = SkillLoader(active_dir)

print("--- TESTING LIFECYCLE ---")

# Test 1: Malicious Tool
malicious = os.path.join(drafts_dir, "malicious_tool.py")
print(f"Inspecting: {malicious}")
if inspector.inspect_file(malicious):
    print("FAIL: Malicious tool passed inspection!")
else:
    print("PASS: Malicious tool blocked.")

# Test 2: Safe Tool
safe = os.path.join(drafts_dir, "dummy_tool.py")
print(f"Inspecting: {safe}")
if inspector.inspect_file(safe):
    print("PASS: Safe tool passed inspection.")
    
    # Promotion
    dest = os.path.join(active_dir, "dummy_tool.py")
    shutil.copy(safe, dest)
    print(f"Promoted to: {dest}")
    
    # Load
    loader.load_tools()
    tool = loader.get_tool("dummy_tool")
    if tool:
        print(f"PASS: Loaded tool '{tool.name}'")
        resp = tool.execute(echo="CyCOS")
        print(f"Execution Result: {resp.message}")
    else:
        print("FAIL: Could not load tool.")

else:
    print("FAIL: Safe tool failed inspection!")

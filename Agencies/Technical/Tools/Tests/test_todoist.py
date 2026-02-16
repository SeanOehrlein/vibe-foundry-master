import os
import shutil
import sys
import time
from io import StringIO

# Add directory to path to find modules
sys.path.append(r'c:\CyCOS\Agencies\Technical\Tools')

from tool_inspector import ToolInspector
from skill_loader import SkillLoader

drafts_dir = r'c:\CyCOS\Agencies\Technical\Tools\Drafts'
active_dir = r'c:\CyCOS\Agencies\Technical\Tools\Active'

print("--- TESTING TODOIST TOOL ---", flush=True)

try:
    inspector = ToolInspector()
    
    # Test: Todoist Tool
    tool_path = os.path.join(drafts_dir, "todoist_tool.py")
    print(f"Inspecting: {tool_path}", flush=True)
    
    if inspector.inspect_file(tool_path):
        print("PASS: Inspector allowed the tool.", flush=True)
        
        # Promotion
        dest = os.path.join(active_dir, "todoist_tool.py")
        if os.path.exists(dest):
            os.remove(dest)
        shutil.copy(tool_path, dest)
        print(f"Promoted to: {dest}", flush=True)
        
        # Load
        loader = SkillLoader(active_dir)
        loader.load_tools()
        
        tool = loader.get_tool("todoist_list_projects")
        if tool:
            print(f"PASS: Loaded tool '{tool.name}'", flush=True)
            print("Executing tool...", flush=True)
            try:
                resp = tool.execute()
                print(f"Execution Result:\nSuccess: {resp.success}\nMessage: {resp.message}", flush=True)
            except Exception as e:
                print(f"CRASH during execution: {e}", flush=True)
        else:
            print("FAIL: Could not load tool. Available: " + str(list(loader.list_tools().keys())), flush=True)

    else:
        print("FAIL: Inspector blocked the tool.", flush=True)

except Exception as e:
    print(f"CRASH in test harness: {e}", flush=True)

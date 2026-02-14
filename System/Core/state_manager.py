import json
import os
from pathlib import Path

class StateManager:
    def __init__(self):
        # CyCOS Root is two levels up from System/Core
        self.root = Path(__file__).resolve().parent.parent.parent
        self.state_path = self.root / "System" / "Registry" / "active_state.json"

    def get_state(self):
        if not self.state_path.exists():
            return {"error": "State file not found"}
        with open(self.state_path, 'r') as f:
            return json.load(f)

    def mount_project(self, agency_name, workspace_name):
        state = self.get_state()
        if "error" in state: return state["error"]
        
        # Foundry workspaces are in Foundry/Active_Workspaces/
        workspace_path = self.root / "Foundry" / "Active_Workspaces" / workspace_name
        
        # Check if it's a System path for core work
        if workspace_name == "System/Core":
            workspace_path = self.root / "System" / "Core"
            
        if not workspace_path.exists():
            return f"Error: Workspace {workspace_name} does not exist at {workspace_path}."

        state["deployment"]["active_agency"] = agency_name
        state["deployment"]["active_workspace"] = str(workspace_path)
        
        with open(self.state_path, 'w') as f:
            json.dump(state, f, indent=4)
        
        return f"SUCCESS: CyCOS pivoted to {agency_name} @ {workspace_name}"

if __name__ == "__main__":
    import sys
    sm = StateManager()
    if len(sys.argv) > 2:
        print(sm.mount_project(sys.argv[1], sys.argv[2]))
    else:
        print(json.dumps(sm.get_state(), indent=2))

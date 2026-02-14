import os
import json
import importlib.util
from typing import Dict, Any

class SkillManager:
    def __init__(self, skills_dir: str):
        self.skills_dir = skills_dir
        self.registry: Dict[str, Dict[str, Any]] = {}

    def discover_skills(self):
        """Scan the skills directory for valid atomic skills."""
        if not os.path.exists(self.skills_dir):
            os.makedirs(self.skills_dir, exist_ok=True)
            return

        for skill_name in os.listdir(self.skills_dir):
            skill_path = os.path.join(self.skills_dir, skill_name)
            if os.path.isdir(skill_path):
                manifest_path = os.path.join(skill_path, "manifest.json")
                if os.path.exists(manifest_path):
                    self._register_skill(skill_name, manifest_path)

    def _register_skill(self, folder_name: str, manifest_path: str):
        """Read manifest and add to registry."""
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            # Basic validation
            required_keys = ["name", "description", "entry_point"]
            if all(key in manifest for key in required_keys):
                self.registry[folder_name] = {
                    "manifest": manifest,
                    "path": os.path.dirname(manifest_path),
                    "loaded_module": None
                }
                print(f"[SkillManager] Registered skill: {manifest['name']}")
        except Exception as e:
            print(f"[SkillManager] Failed to register skill in {folder_name}: {e}")

    def execute_skill(self, folder_name: str, params: Dict[str, Any] = None):
        """Dynamically load and execute a skill's entry point."""
        if folder_name not in self.registry:
            raise ValueError(f"Skill '{folder_name}' not found.")

        skill_info = self.registry[folder_name]
        manifest = skill_info["manifest"]
        
        # Dynamic Import
        if not skill_info["loaded_module"]:
            module_path = os.path.join(skill_info["path"], manifest["entry_point"])
            spec = importlib.util.spec_from_file_location(folder_name, module_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            skill_info["loaded_module"] = module

        # Execution
        if hasattr(skill_info["loaded_module"], "run"):
            return skill_info["loaded_module"].run(params or {})
        else:
            raise AttributeError(f"Skill '{folder_name}' missing 'run()' function.")

    def list_skills(self):
        """Return metadata for all registered skills."""
        return [
            {
                "id": k,
                "name": v["manifest"]["name"],
                "description": v["manifest"]["description"],
                "triggers": v["manifest"].get("trigger_keywords", [])
            }
            for k, v in self.registry.items()
        ]

# Initialize global SkillManager
# Redirecting to root Agencies plane (Technical wing)
_current_dir = os.path.dirname(__file__)
SKILLS_PATH = os.path.abspath(os.path.join(_current_dir, "..", "..", "..", "Agencies", "Technical", "Skills"))
skills = SkillManager(SKILLS_PATH)
skills.discover_skills()

import importlib.util
import os
import sys
from typing import Dict, Type
from base_tool import BaseTool

class SkillLoader:
    def __init__(self, tools_dir: str):
        self.tools_dir = tools_dir
        self.loaded_tools: Dict[str, BaseTool] = {}

    def load_tools(self):
        """Scans the tools directory and loads all valid BaseTool implementations."""
        if not os.path.exists(self.tools_dir):
            print(f"Tools directory not found: {self.tools_dir}")
            return

        for filename in os.listdir(self.tools_dir):
            if filename.endswith(".py") and filename != "__init__.py":
                self._load_file(os.path.join(self.tools_dir, filename))

    def _load_file(self, file_path: str):
        module_name = os.path.basename(file_path).replace(".py", "")
        
        try:
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_name] = module
                spec.loader.exec_module(module)
                
                # Scan for BaseTool subclasses
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if isinstance(attr, type) and issubclass(attr, BaseTool) and attr is not BaseTool:
                        # Instantiate
                        try:
                            tool_instance = attr()
                            self.loaded_tools[tool_instance.name] = tool_instance
                            print(f"[SkillLoader] Loaded: {tool_instance.name}")
                        except Exception as e:
                            print(f"[SkillLoader] Failed to instantiate {attr_name}: {e}")

        except Exception as e:
            print(f"[SkillLoader] Error loading {file_path}: {e}")

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self.loaded_tools.get(name)

    def list_tools(self) -> Dict[str, str]:
        """Returns name: description mapping."""
        return {t.name: t.description for t in self.loaded_tools.values()}

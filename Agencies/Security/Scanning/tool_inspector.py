import ast
import os

class ToolInspector:
    """
    Security Validator for Dynamic Tools.
    Parses Python code AST to accept/reject based on safety rules.
    """
    
    FORBIDDEN_IMPORTS = {
        "os", "subprocess", "sys", "socket", "shutil", "urllib"
    }
    
    FORBIDDEN_FUNCTIONS = {
        "eval", "exec", "compile", "open"
    }

    def inspect_file(self, file_path: str) -> bool:
        """
        Returns True if the file is safe, False otherwise.
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                source = f.read()
            
            tree = ast.parse(source)
            
            for node in ast.walk(tree):
                # Check imports
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    if self._check_import(node):
                        return False
                
                # Check function calls
                if isinstance(node, ast.Call):
                    if self._check_call(node):
                        return False

            return True

        except Exception as e:
            print(f"[Inspector] Failed to parse {file_path}: {e}")
            return False

    def _check_import(self, node) -> bool:
        """Returns True if forbidden import found."""
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.split('.')[0] in self.FORBIDDEN_IMPORTS:
                    print(f"[Inspector] Security Violation: Forbidden import '{alias.name}'")
                    return True
        elif isinstance(node, ast.ImportFrom):
            if node.module and node.module.split('.')[0] in self.FORBIDDEN_IMPORTS:
                print(f"[Inspector] Security Violation: Forbidden import from '{node.module}'")
                return True
        return False

    def _check_call(self, node) -> bool:
        """Returns True if forbidden function called."""
        if isinstance(node.func, ast.Name):
            if node.func.id in self.FORBIDDEN_FUNCTIONS or node.func.id == "__import__":
                print(f"[Inspector] Security Violation: Forbidden function '{node.func.id}'")
                return True
        return False

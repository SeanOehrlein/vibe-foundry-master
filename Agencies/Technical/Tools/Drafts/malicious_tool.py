from base_tool import BaseTool, ToolResponse
import os # Forbidden import

class MaliciousTool(BaseTool):
    @property
    def name(self) -> str:
        return "malicious_tool"
        
    @property
    def description(self) -> str:
        return "Tries to use os.system"

    @property
    def input_schema(self) -> dict:
        return {}

    def execute(self, **kwargs) -> ToolResponse:
        os.system("echo 'I am evil'")
        return ToolResponse(success=True, message="Executed evil")

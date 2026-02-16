from base_tool import BaseTool, ToolResponse

class DummyTool(BaseTool):
    @property
    def name(self) -> str:
        return "dummy_tool"

    @property
    def description(self) -> str:
        return "A dummy tool for testing the loader."

    @property
    def input_schema(self) -> dict:
        return {"echo": "String to echo back"}

    def execute(self, echo: str = "Hello", **kwargs) -> ToolResponse:
        return ToolResponse(success=True, message=f"Echo: {echo}")

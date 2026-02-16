import requests
from base_tool import BaseTool, ToolResponse
from cycos_utils import get_secret

class TodoistProjectListTool(BaseTool):
    @property
    def name(self) -> str:
        return "todoist_list_projects"

    @property
    def description(self) -> str:
        return "Lists all projects from Todoist using the API."

    @property
    def input_schema(self) -> dict:
        return {}

    def execute(self, **kwargs) -> ToolResponse:
        api_key = get_secret("TODOIST_API_KEY")
        if not api_key:
            return ToolResponse(success=False, message="Missing TODOIST_API_KEY in environment.")

        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            response = requests.get("https://api.todoist.com/rest/v2/projects", headers=headers)
            response.raise_for_status()
            projects = response.json()
            # Format output nicely
            project_names = [p["name"] for p in projects]
            return ToolResponse(success=True, message=f"Found {len(projects)} projects: {', '.join(project_names)}", data={"projects": projects})
        except Exception as e:
            return ToolResponse(success=False, message=f"API Error: {str(e)}")

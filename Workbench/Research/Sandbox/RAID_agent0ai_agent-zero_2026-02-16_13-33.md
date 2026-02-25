# Surgical Context: agent0ai/agent-zero
**Date**: 2026-02-16_13-33
**Source**: https://github.com/agent0ai/agent-zero

---

## FILE: python/helpers/extract_tools.py
```
import re, os, importlib, importlib.util, inspect
from types import ModuleType
from typing import Any, Type, TypeVar
from .dirty_json import DirtyJson
from .files import get_abs_path, deabsolute_path
import regex
from fnmatch import fnmatch

def json_parse_dirty(json:str) -> dict[str,Any] | None:
    if not json or not isinstance(json, str):
        return None

    ext_json = extract_json_object_string(json.strip())
    if ext_json:
        try:
            data = DirtyJson.parse_string(ext_json)
            if isinstance(data,dict): return data
        except Exception:
            # If parsing fails, return None instead of crashing
            return None
    return None

def extract_json_object_string(content):
    start = content.find('{')
    if start == -1:
        return ""

    # Find the first '{'
    end = content.rfind('}')
    if end == -1:
        # If there's no closing '}', return from start to the end
        return content[start:]
    else:
        # If there's a closing '}', return the substring from start to end
        return content[start:end+1]

def extract_json_string(content):
    # Regular expression pattern to match a JSON object
    pattern = r'\{(?:[^{}]|(?R))*\}|\[(?:[^\[\]]|(?R))*\]|"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?'

    # Search for the pattern in the content
    match = regex.search(pattern, content)

    if match:
        # Return the matched JSON string
        return match.group(0)
    else:
        return ""

def fix_json_string(json_string):
    # Function to replace unescaped line breaks within JSON string values
    def replace_unescaped_newlines(match):
        return match.group(0).replace('\n', '\\n')

    # Use regex to find string values and apply the replacement function
    fixed_string = re.sub(r'(?<=: ")(.*?)(?=")', replace_unescaped_newlines, json_string, flags=re.DOTALL)
    return fixed_string


T = TypeVar('T')  # Define a generic type variable

def import_module(file_path: str) -> ModuleType:
    # Handle file paths with periods in the name using importlib.util
    abs_path = get_abs_path(file_path)
    module_name = os.path.basename(abs_path).replace('.py', '')
    
    # Create the module spec and load the module
    spec = importlib.util.spec_from_file_location(module_name, abs_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load module from {abs_path}")
        
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def load_classes_from_folder(folder: str, name_pattern: str, base_class: Type[T], one_per_file: bool = True) -> list[Type[T]]:
    classes = []
    abs_folder = get_abs_path(folder)

    # Get all .py files in the folder that match the pattern, sorted alphabetically
    py_files = sorted(
        [file_name for file_name in os.listdir(abs_folder) if fnmatch(file_name, name_pattern) and file_name.endswith(".py")]
    )

    # Iterate through the sorted list of files
    for file_name in py_files:
        file_path = os.path.join(abs_folder, file_name)
        # Use the new import_module function
        module = import_module(file_path)

        # Get all classes in the module
        class_list = inspect.getmembers(module, inspect.isclass)

        # Filter for classes that are subclasses of the given base_class
        # iterate backwards to skip imported superclasses
        for cls in reversed(class_list):
            if cls[1] is not base_class and issubclass(cls[1], base_class):
                classes.append(cls[1])
                if one_per_file:
                    break

    return classes

def load_classes_from_file(file: str, base_class: type[T], one_per_file: bool = True) -> list[type[T]]:
    classes = []
    # Use the new import_module function
    module = import_module(file)
    
    # Get all classes in the module
    class_list = inspect.getmembers(module, inspect.isclass)
    
    # Filter for classes that are subclasses of the given base_class
    # iterate backwards to skip imported superclasses
    for cls in reversed(class_list):
        if cls[1] is not base_class and issubclass(cls[1], base_class):
            classes.append(cls[1])
            if one_per_file:
                break
                
    return classes

```

## FILE: python/helpers/tool.py
```
from abc import abstractmethod
from dataclasses import dataclass
from typing import Any

from agent import Agent, LoopData
from python.helpers.print_style import PrintStyle
from python.helpers.strings import sanitize_string


@dataclass
class Response:
    message:str
    break_loop: bool
    additional: dict[str, Any] | None = None

class Tool:

    def __init__(self, agent: Agent, name: str, method: str | None, args: dict[str,str], message: str, loop_data: LoopData | None, **kwargs) -> None:
        self.agent = agent
        self.name = name
        self.method = method
        self.args = args
        self.loop_data = loop_data
        self.message = message
        self.progress: str = ""

    @abstractmethod
    async def execute(self,**kwargs) -> Response:
        pass

    def set_progress(self, content: str | None):
        self.progress = content or ""

    def add_progress(self, content: str | None):
        if not content:
            return
        self.progress += content

    async def before_execution(self, **kwargs):
        PrintStyle(font_color="#1B4F72", padding=True, background_color="white", bold=True).print(f"{self.agent.agent_name}: Using tool '{self.name}'")
        self.log = self.get_log_object()
        if self.args and isinstance(self.args, dict):
            for key, value in self.args.items():
                PrintStyle(font_color="#85C1E9", bold=True).stream(self.nice_key(key)+": ")
                PrintStyle(font_color="#85C1E9", padding=isinstance(value,str) and "\n" in value).stream(value)
                PrintStyle().print()

    async def after_execution(self, response: Response, **kwargs):
        text = sanitize_string(response.message.strip())
        self.agent.hist_add_tool_result(self.name, text, **(response.additional or {}))
        PrintStyle(font_color="#1B4F72", background_color="white", padding=True, bold=True).print(f"{self.agent.agent_name}: Response from tool '{self.name}'")
        PrintStyle(font_color="#85C1E9").print(text)
        self.log.update(content=text)

    def get_log_object(self):
        if self.method:
            heading = f"icon://construction {self.agent.agent_name}: Using tool '{self.name}:{self.method}'"
        else:
            heading = f"icon://construction {self.agent.agent_name}: Using tool '{self.name}'"
        return self.agent.context.log.log(type="tool", heading=heading, content="", kvps=self.args, _tool_name=self.name)

    def nice_key(self, key:str):
        words = key.split('_')
        words = [words[0].capitalize()] + [word.lower() for word in words[1:]]
        result = ' '.join(words)
        return result

```

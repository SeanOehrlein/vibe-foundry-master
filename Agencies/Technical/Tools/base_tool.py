from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from dataclasses import dataclass

@dataclass
class ToolResponse:
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class BaseTool(ABC):
    """
    The Base Contract for all CyCOS Dynamic Tools.
    Any script in 'Active' MUST inherit from this class.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """The unique name of the tool (e.g., 'pdf_converter')."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """
        A clear description for the AI to understand when to use this.
        Example: 'Converts a PDF file to a text string.'
        """
        pass

    @property
    @abstractmethod
    def input_schema(self) -> Dict[str, str]:
        """
        Key-Value pair describing arguments.
        Example: {'file_path': 'Absolute path to the PDF'}
        """
        pass

    @abstractmethod
    def execute(self, **kwargs) -> ToolResponse:
        """
        The main execution logic. 
        MUST return a ToolResponse object.
        """
        pass

import os
import json
from typing import Dict, List
import chromadb
from chromadb.config import Settings

class MemoryManager:
    def __init__(self, base_path: str):
        self.base_path = base_path
        self.episodic_memory: Dict[str, List[dict]] = {}
        
        # Initialize Semantic Memory (ChromaDB)
        self.chroma_client = chromadb.PersistentClient(
            path=os.path.join(base_path, "Semantic", "VectorStore")
        )
        self.collection = self.chroma_client.get_or_create_collection(
            name="assistant_knowledge"
        )
        
        # Load TELOS Goals
        self.goals_path = os.path.join(base_path, "Semantic", "Goals")
        self.directives = self._load_json("Directives.json")
        self.objectives = self._load_json("Objectives.json")

    def _load_json(self, filename: str) -> dict:
        path = os.path.join(self.goals_path, filename)
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
        return {}

    def get_episodic_context(self, session_id: str, limit: int = 5) -> List[dict]:
        """Retrieve recent conversation history for a session."""
        return self.episodic_memory.get(session_id, [])[-limit:]

    def add_episodic_event(self, session_id: str, role: str, content: str):
        """Add a new message to the session context."""
        if session_id not in self.episodic_memory:
            self.episodic_memory[session_id] = []
        self.episodic_memory[session_id].append({"role": role, "content": content})

    def query_semantic_memory(self, query: str, n_results: int = 3) -> List[str]:
        """Search long-term knowledge using vector similarity."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results['documents'][0] if results['documents'] else []

    def get_system_prompt_context(self) -> str:
        """Construct the system context using the root System_Policy.md."""
        policy_path = os.path.abspath(os.path.join(self.base_path, "..", "System", "Policy", "System_Policy.md"))
        if os.path.exists(policy_path):
            with open(policy_path, 'r') as f:
                return f"CyCOS Prime Directive:\n{f.read()}\n"
        return "CyCOS Prime Directive: None found."

# Singleton instance for the execution layer
# Redirecting to root Memory plane
_current_dir = os.path.dirname(__file__)
root_memory_path = os.path.abspath(os.path.join(_current_dir, "..", "..", "..", "Memory"))
memory = MemoryManager(base_path=root_memory_path)

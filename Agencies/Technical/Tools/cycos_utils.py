import os
from dotenv import load_dotenv

# Hardcoded path to the single source of truth for secrets
ENV_PATH = r"c:\CyCOS\System\Core\Manager\.env"

def get_secret(key: str) -> str:
    """Safe way for tools to access secrets without importing os."""
    load_dotenv(ENV_PATH)
    val = os.getenv(key)
    return val if val else ""

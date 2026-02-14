from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from memory_manager import memory
from skill_manager import skills

app = FastAPI(title="Vibe Coding Master Execution Layer")

class TaskRequest(BaseModel):
    task: str
    session_id: str = "default_session"
    context: dict = {}

@app.get("/")
async def root():
    return {"status": "online", "service": "Vibe Coding Master Execution Layer"}

@app.get("/skills")
async def list_skills():
    return {"skills": skills.list_skills()}

@app.post("/execute")
async def execute_task(request: TaskRequest):
    # 1. Retrieve Episodic context for the session
    history = memory.get_episodic_context(request.session_id)
    
    # 2. Get high-level TELOS context
    system_context = memory.get_system_prompt_context()
    
    # 3. Pattern Match for Skills
    task_lower = request.task.lower()
    matched_skill = None
    
    for s in skills.list_skills():
        if any(keyword in task_lower for keyword in s["triggers"]):
            matched_skill = s["id"]
            break

    if matched_skill:
        # Execute the specific skill
        response_data = skills.execute_skill(matched_skill, request.context)
        response_message = response_data.get("message", "Skill executed.")
    else:
        # Fallback to standard LLM logic (placeholder)
        response_message = f"Task '{request.task}' processed with session context."
    
    # 4. Memory Updates
    memory.add_episodic_event(request.session_id, "user", request.task)
    memory.add_episodic_event(request.session_id, "assistant", response_message)
    
    return {
        "status": "success",
        "session_id": request.session_id,
        "matched_skill": matched_skill,
        "history_length": len(history),
        "system_context": system_context,
        "message": response_message
    }

if __name__ == "__main__":
    # Ensure skills are discovered on startup
    skills.discover_skills()
    uvicorn.run(app, host="0.0.0.0", port=8000)

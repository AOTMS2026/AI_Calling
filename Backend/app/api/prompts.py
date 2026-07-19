from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os

router = APIRouter(prefix="/prompts", tags=["prompts"])

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts")
os.makedirs(PROMPTS_DIR, exist_ok=True)

class PromptFile(BaseModel):
    filename: str
    content: str

@router.post("/save")
def save_prompt_file(req: PromptFile):
    """Saves a string prompt safely into a physical text file in the backend/prompts folder"""
    safe_name = "".join([c for c in req.filename if c.isalpha() or c.isdigit() or c in (' ', '-', '_')]).rstrip()
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    file_path = os.path.join(PROMPTS_DIR, f"{safe_name}.txt")
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(req.content)
        return {"message": "Prompt successfully written to disk.", "file": f"{safe_name}.txt"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def list_prompts():
    """Lists all available saved physical text prompts."""
    try:
        files = [f for f in os.listdir(PROMPTS_DIR) if f.endswith(".txt")]
        return {"prompts": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/read/{filename}")
def read_prompt(filename: str):
    """Reads the exact structural prompt payload from the disk safely"""
    safe_name = os.path.basename(filename) # prevents directory traversal
    file_path = os.path.join(PROMPTS_DIR, safe_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Prompt file not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"filename": safe_name, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

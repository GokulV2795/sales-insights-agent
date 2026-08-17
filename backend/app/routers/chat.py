from fastapi import APIRouter, HTTPException

from app import agent
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def post_chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")
    try:
        reply = agent.chat(payload.message, payload.session_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Agent error: {exc}") from exc
    return {"reply": reply, "session_id": payload.session_id}


@router.post("/reset")
def post_reset(session_id: str = "default"):
    agent.reset_session(session_id)
    return {"status": "reset", "session_id": session_id}

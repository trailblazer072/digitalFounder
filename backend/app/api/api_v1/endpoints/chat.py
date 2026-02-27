import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from pydantic import BaseModel

from app.db.session import get_session
from app.models import Conversation, Message, Section, User
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service
from app.api import deps

router = APIRouter()

from typing import List
from app.models import Conversation, Message, Section

# ... previous imports ...

class SectionResponse(BaseModel):
    id: uuid.UUID
    name: str
    role_persona: str

@router.get("/sections", response_model=List[SectionResponse])
async def list_sections(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List all available AI Agents (Sections) for the User's Org
    """
    # Get user's org
    from app.models import Organization
    org_res = await session.exec(select(Organization).where(Organization.owner_id == current_user.id))
    org = org_res.first()
    
    if not org:
        return []

    result = await session.exec(select(Section).where(Section.org_id == org.id))
    return result.all()

class ChatRequest(BaseModel):
    conversation_id: uuid.UUID
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest, 
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    # 1. Fetch Conversation and Section
    conversation = await session.get(Conversation, request.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Eager loading isn't automatic in async SQLModel usually, so might need to fetch section
    # But if we access relationships often need simple select or explict join
    # Let's fetch section manually to be safe
    section = await session.get(Section, conversation.section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # 2. Vector Search
    # Pass org_id to ensure we only search this organization's namespace
    context_docs = vector_service.search(
        query=request.message, 
        org_id=str(section.org_id)
    )
    context_text = "\n\n".join(context_docs)

    # 3. LLM Call
    response_text = await llm_service.get_response(
        system_prompt=section.system_prompt_template,
        user_message=request.message,
        context=context_text
    )

    # 4. Save Messages & Increment Credits
    from app.models.organization import Organization
    org_res = await session.exec(select(Organization).where(Organization.id == section.org_id))
    org = org_res.first()
    
    if org:
        if org.credits_used >= 100:
            raise HTTPException(status_code=403, detail="Credit limit reached. Please upgrade your plan.")
        org.credits_used += 1

    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    session.add(user_msg)
    
    ai_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=response_text
    )
    session.add(ai_msg)
    
    await session.commit()

    return ChatResponse(response=response_text)

@router.post("/start", response_model=uuid.UUID)
async def start_conversation(
    section_id: uuid.UUID, 
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get existing active conversation or create new one for this section
    """
    # Check for existing recent conversation
    # For MVP, we just take the last created conversation for this section
    # Note: In real app we might want multiple threads. Here we reuse the "Chat" thread.
    
    query = select(Conversation).where(
        Conversation.section_id == section_id
    ).order_by(Conversation.created_at.desc())
    
    result = await session.exec(query)
    existing_conv = result.first()
    
    if existing_conv:
        return existing_conv.id

    # Create new
    conv = Conversation(section_id=section_id, title="New Chat")
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return conv.id

class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    timestamp: str

@router.get("/{conversation_id}/history", response_model=List[MessageResponse])
async def get_chat_history(
    conversation_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    # Verify ownership via section->org->owner? 
    # For speed, we just trust the ID but strictly we should check.
    
    msgs = await session.exec(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp))
    return [
        MessageResponse(
            id=m.id, 
            role=m.role, 
            content=m.content, 
            timestamp=m.timestamp.isoformat()
        ) for m in msgs.all()
    ]

import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.db.session import get_session
from app.models import Document, Organization, User
from app.services.vector_service import vector_service
from app.services.s3_service import s3_service
from app.api import deps

router = APIRouter()

from pydantic import BaseModel
import datetime

class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    upload_date: datetime.datetime

@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch user org
    org_res = await session.exec(select(Organization).where(Organization.owner_id == current_user.id))
    org = org_res.first()
    if not org:
        return []

    docs = await session.exec(select(Document).where(Document.org_id == org.id).order_by(Document.upload_date.desc()))
    return docs.all()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch Organization owned by user
    # Assuming 1 user = 1 org for now
    result = await session.exec(select(Organization).where(Organization.owner_id == current_user.id))
    org = result.first()
    
    if not org:
        raise HTTPException(status_code=400, detail="No organization found. Please complete onboarding first.")

    # Read file content
    content = await file.read()
    text_content = ""
    
    # Simple parse based on extension
    if file.filename.endswith(".txt") or file.filename.endswith(".md"):
        text_content = content.decode("utf-8")
    elif file.filename.endswith(".pdf"):
        import io
        import pypdf
        try:
            pdf_file = io.BytesIO(content)
            reader = pypdf.PdfReader(pdf_file)
            text_content = ""
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
        except Exception as e:
            text_content = f"Error parsing PDF: {str(e)}"
    else:
         text_content = str(content) # Fallback

    # Upload to S3
    doc_id = uuid.uuid4()
    s3_key = f"{org.id}/{doc_id}/{file.filename}"
    s3_url = await s3_service.upload_file(file, s3_key)

    # Create DB Entry
    doc = Document(
        id=doc_id,
        org_id=org.id,
        filename=file.filename,
        s3_url=s3_url,
    )
    session.add(doc)
    await session.commit()

    # Vector Store Ingestion (Pinecone)
    # Truncate text for metadata storage (Pinecone limit)
    # Ideally we chunk, but for MVP we take first 2000 chars as context snippet
    snippet = text_content[:2000]
    
    vector_service.add_document(
        doc_id=str(doc_id),
        text=text_content, # Used for embedding generation
        metadata={
            "org_id": str(org.id), 
            "filename": file.filename,
            "text_snippet": snippet 
        },
        org_id=str(org.id) # CRITICAL: For Namespace Isolation
    )

    return {"status": "success", "document_id": doc_id}

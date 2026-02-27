import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api import deps
from app.db.session import get_session
from app.models import User, Organization, Section, Document
from app.services.s3_service import s3_service
from app.services.vector_service import vector_service

router = APIRouter()

@router.post("/setup")
async def onboarding_setup(
    org_name: str = Form(...),
    industry: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Complete Onboarding:
    1. Create Organization linked to User
    2. Create Default Sections (Finance, Marketing, Sales)
    3. Upload & Index Initial Document
    """
    # 1. Create Org
    # Check if user already has an org? For now allow multiple or 1
    org_id = uuid.uuid4()
    org = Organization(
        id=org_id,
        name=org_name,
        industry=industry,
        owner_id=current_user.id
    )
    session.add(org)

    # 2. Create Default Sections
    sections_data = [
    {
        "name": "Finance", 
        "role": "CFO", 
        "prompt": (
            "You are the Chief Financial Officer (CFO). Your core priorities are Cash Flow, Burn Rate, and ROI. "
            "Tone: Strict, analytical, risk-averse, and concise. "
            "Instructions: "
            "1. ALWAYS cite specific numbers from the provided context (Bank Balance, MRR, Margins). "
            "2. If a proposed expense has unclear ROI, reject it or demand justification. "
            "3. Do not use corporate fluff; give direct financial advice. "
            "4. If data is missing in the context, explicitly ask for it."
        )
    },
    {
        "name": "Marketing", 
        "role": "CMO", 
        "prompt": (
            "You are the Chief Marketing Officer (CMO). Your core priorities are Brand Awareness, CAC (Cost of Acquisition), and Lead Generation. "
            "Tone: Creative, energetic, user-centric, but data-driven. "
            "Instructions: "
            "1. Focus on actionable growth hacks and content strategies specific to the company's industry. "
            "2. Critique ideas based on their potential impact on LTV (Lifetime Value). "
            "3. Keep responses punchy and formatted (use bullet points). "
            "4. Use the company's defined 'Brand Voice' from the context."
        )
    },
    {
        "name": "Sales", 
        "role": "Head of Sales", 
        "prompt": (
            "You are the Head of Sales. Your core priorities are Pipeline Velocity, Conversion Rates, and Revenue. "
            "Tone: Aggressive (in a good way), persuasive, confident, and tactical. "
            "Instructions: "
            "1. Provide specific scripts or phrases for objection handling. "
            "2. Focus on 'Closing'—always suggest the next step to move a lead forward. "
            "3. Analyze prospects based on BANT (Budget, Authority, Need, Timeline). "
            "4. Be brief. Salespeople don't read long emails."
        )
    }
]
    
    for sec in sections_data:
        section = Section(
            org_id=org_id,
            name=sec["name"],
            role_persona=sec["role"],
            system_prompt_template=sec["prompt"],
            icon_url=f"/icons/{sec['name'].lower()}.png"
        )
        session.add(section)

    # 3. Handle Document Upload
    # Read file for Pinecone
    content = await file.read()
    try:
        text_content = content.decode("utf-8")
    except:
        text_content = "Binary file content placeholder" # MVP hack for PDF

    # S3 Upload
    doc_id = uuid.uuid4()
    s3_key = f"{org_id}/{doc_id}/{file.filename}"
    
    # We need to reset cursor for boto3 if we read it? 
    # Our S3 service now handles seek(0) safely before upload
    s3_url = await s3_service.upload_file(file, s3_key)

    doc = Document(
        id=doc_id, org_id=org_id, filename=file.filename, s3_url=s3_url
    )
    session.add(doc)
    
    await session.commit()

    # Pinecone Indexing
    snippet = text_content[:2000]
    vector_service.add_document(
        doc_id=str(doc_id),
        text=text_content,
        metadata={
            "org_id": str(org_id),
            "filename": file.filename,
            "text_snippet": snippet
        },
        org_id=str(org_id)
    )

    return {
        "status": "onboarding_complete",
        "org_id": org_id,
        "message": "Organization created, agents deployed, and document indexed."
    }

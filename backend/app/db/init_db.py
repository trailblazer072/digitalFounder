import uuid
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models import Organization, Section

async def init_db(session: AsyncSession):
    # Check if we have an organization, if not create a default one
    result = await session.exec(select(Organization).limit(1))
    org = result.first()
    
    if not org:
        org = Organization(
            name="Default Startup",
            industry="Tech",
            id=uuid.uuid4()
        )
        session.add(org)
        await session.commit()
        await session.refresh(org)
    
    # Define default sections
    sections_data = [
        {
            "name": "Finance",
            "role_persona": "Act as a strict, analytical CFO. Focus on ROI and cash flow.",
            "system_prompt_template": "You are the CFO. Your goal is financial health. Analyze all requests with a focus on budget, runway, and ROI."
        },
        {
            "name": "Marketing",
            "role_persona": "Act as a creative CMO. Focus on growth, brand, and user acquisition.",
            "system_prompt_template": "You are the CMO. Your goal is market capture. Focus on branding, campaigns, and user metrics."
        },
        {
            "name": "Sales",
            "role_persona": "Act as an aggressive Head of Sales. Focus on pipelines and closing.",
            "system_prompt_template": "You are the VP of Sales. Your goal is revenue. Focus on leads, pipelines, and closing deals."
        }
    ]

    for sec_data in sections_data:
        # Check if section exists for this org
        result = await session.exec(
            select(Section).where(Section.org_id == org.id, Section.name == sec_data["name"])
        )
        existing_section = result.first()
        
        if not existing_section:
            section = Section(
                org_id=org.id,
                name=sec_data["name"],
                role_persona=sec_data["role_persona"],
                system_prompt_template=sec_data["system_prompt_template"],
                icon_url=f"/icons/{sec_data['name'].lower()}.png"
            )
            session.add(section)
    
    await session.commit()

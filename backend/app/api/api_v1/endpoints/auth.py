from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api import deps
from app.core import security
from app.db.session import get_session
from app.models.user import User
from app.schemas.auth_schemas import Token, UserCreate

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    session: AsyncSession = Depends(get_session), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    # Check User
    result = await session.exec(select(User).where(User.email == form_data.username))
    user = result.first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=60 * 24 * 8)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=Token)
async def register(
    user_in: UserCreate,
    session: AsyncSession = Depends(get_session)
) -> Any:
    # Check existing
    result = await session.exec(select(User).where(User.email == user_in.email))
    if result.first():
        raise HTTPException(
            status_code=400,
            detail="The user with this user name already exists in the system",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    access_token_expires = timedelta(minutes=60 * 24 * 8)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me")
async def read_users_me(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    # Fetch Org
    from app.models.organization import Organization
    org_res = await session.exec(select(Organization).where(Organization.owner_id == current_user.id))
    org = org_res.first()
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "org": {
            "name": org.name,
            "industry": org.industry,
            "credits_used": org.credits_used
        } if org else None
    }

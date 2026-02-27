from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, get_session
from app.api.api_v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables (for local dev convenience)
    from sqlmodel import SQLModel
    # Explicitly import models to ensure they are registered in SQLModel.metadata
    from app.models import User, Organization, Section, Conversation, Message, Document
    
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all) # Uncomment to reset
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Init DB (Seed data)
    # The get_session dependency is a generator, so we use sessionmaker directly or handle it
    # simpler way for init script:
    from sqlalchemy.orm import sessionmaker
    from sqlmodel.ext.asyncio.session import AsyncSession
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        from app.db.init_db import init_db as seed_db
        await seed_db(db)
            
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
origins = ["http://localhost:5173", "http://localhost:8000"]
if settings.BACKEND_CORS_ORIGINS:
    origins.extend([str(origin) for origin in settings.BACKEND_CORS_ORIGINS])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Axel Backend"}

# Include Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

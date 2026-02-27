import uuid
from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

# Forward references if needed, but here simple ordering or strings work.

class Organization(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    industry: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    owner_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    credits_used: int = Field(default=0)

    # Relationships
    sections: List["Section"] = Relationship(back_populates="organization")
    documents: List["Document"] = Relationship(back_populates="organization")

class Section(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organization.id")
    name: str
    role_persona: str
    system_prompt_template: str
    icon_url: Optional[str] = None

    # Relationships
    organization: Optional[Organization] = Relationship(back_populates="sections")
    conversations: List["Conversation"] = Relationship(back_populates="section")

# Need to import Document and Conversation if we want type checking completely,
# but for SQLModel runtime, string forward refs usually suffice if models are loaded.

import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship

class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organization.id")
    filename: str
    s3_url: str # or local path
    upload_date: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    organization: Optional["Organization"] = Relationship(back_populates="documents")

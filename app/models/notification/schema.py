from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

class Notification(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    type: str  # question, order, favorite, system, report
    title: str
    message: str
    read: bool = False
    data: Optional[Dict[str, Any]] = None  # Dados específicos do tipo de notificação
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Report(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    reporter_id: str
    reported_item_id: str  # ID do anúncio, usuário, etc.
    reported_item_type: str  # ad, user, message
    reason: str
    details: Optional[str] = None
    status: str = "pending"  # pending, reviewed, resolved, dismissed
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ReportCreate(BaseModel):
    reported_item_id: str
    reported_item_type: str
    reason: str
    details: Optional[str] = None

class ReportUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
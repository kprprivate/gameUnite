from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class SupportTicket(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    protocol_number: Optional[str] = None
    subject: str
    message: str
    status: str = "open"  # open, in_progress, resolved, closed
    category: str = "general"  # general, technical, billing, account
    priority: str = "medium"  # low, medium, high, urgent
    admin_response: Optional[str] = None
    admin_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SupportTicketCreate(BaseModel):
    subject: str
    message: str
    category: str = "general"
    priority: str = "medium"

class SupportTicketUpdate(BaseModel):
    status: Optional[str] = None
    admin_response: Optional[str] = None
    priority: Optional[str] = None
    resolved_at: Optional[datetime] = None

class SellerRating(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    order_id: str
    seller_id: str
    buyer_id: str
    rating: int = Field(ge=1, le=5)  # 1-5 stars
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SellerRatingCreate(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class GameCategory(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class GameCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class GameCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
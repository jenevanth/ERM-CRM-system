from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal


class ChallanItemInput(BaseModel):
    product_id: str
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("quantity must be > 0")
        return v


class ChallanCreate(BaseModel):
    customer_id: str
    items: list[ChallanItemInput]

    @field_validator("items")
    @classmethod
    def must_have_items(cls, v):
        if not v:
            raise ValueError("Challan must have at least one item")
        return v


class ChallanItemResponse(BaseModel):
    id: str
    challan_id: str
    product_id: Optional[str]
    product_name_snapshot: str
    sku_snapshot: str
    unit_price_snapshot: Decimal
    quantity: int


class ChallanResponse(BaseModel):
    id: str
    challan_number: str
    customer_id: str
    customer_name: Optional[str]
    total_quantity: int
    status: str
    created_by: Optional[str]
    created_at: datetime
    items: list[ChallanItemResponse] = []


class PaginatedChallans(BaseModel):
    data: list[ChallanResponse]
    total: int
    page: int
    limit: int

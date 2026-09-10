from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal

MovementType = Literal["IN", "OUT"]


class StockMovementCreate(BaseModel):
    product_id: str
    quantity: int
    movement_type: MovementType
    reason: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("quantity must be > 0")
        return v


class StockMovementResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str]
    quantity: int
    movement_type: str
    reason: Optional[str]
    created_by: Optional[str]
    created_at: datetime


class InventoryItemResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    unit_price: Decimal
    current_stock: int
    minimum_stock: int
    warehouse: Optional[str]
    is_low_stock: bool


class PaginatedMovements(BaseModel):
    data: list[StockMovementResponse]
    total: int
    page: int
    limit: int

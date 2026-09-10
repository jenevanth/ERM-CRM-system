from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ProductCreate(BaseModel):
    name: str
    sku: str
    category: str
    unit_price: Decimal
    current_stock: int = 0
    minimum_stock: int = 0
    warehouse: Optional[str] = None

    @field_validator("unit_price")
    @classmethod
    def price_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("unit_price must be >= 0")
        return v

    @field_validator("current_stock", "minimum_stock")
    @classmethod
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("Stock values must be >= 0")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[Decimal] = None
    minimum_stock: Optional[int] = None
    warehouse: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    unit_price: Decimal
    current_stock: int
    minimum_stock: int
    warehouse: Optional[str]
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime


class PaginatedProducts(BaseModel):
    data: list[ProductResponse]
    total: int
    page: int
    limit: int

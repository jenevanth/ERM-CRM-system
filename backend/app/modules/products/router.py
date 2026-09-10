from fastapi import APIRouter, Depends, Query
from typing import Optional
import asyncpg

from app.database import get_db
from app.middleware.auth import AuthUser, get_current_user, require_roles
from app.exceptions import NotFoundError
from app.modules.products.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, PaginatedProducts,
)
from app.modules.products import repository

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedProducts)
async def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    low_stock: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows, total = await repository.list_products(db, search, category, low_stock, page, limit)
    return PaginatedProducts(
        data=[ProductResponse(**r) for r in rows],
        total=total, page=page, limit=limit,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    product = await repository.get_product_by_id(db, product_id)
    if not product:
        raise NotFoundError("Product", product_id)
    return ProductResponse(**product)


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    body: ProductCreate,
    current_user: AuthUser = Depends(require_roles("ADMIN", "WAREHOUSE")),
    db: asyncpg.Connection = Depends(get_db),
):
    product = await repository.create_product(db, body.model_dump(), current_user.id)
    return ProductResponse(**product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    current_user: AuthUser = Depends(require_roles("ADMIN", "WAREHOUSE")),
    db: asyncpg.Connection = Depends(get_db),
):
    existing = await repository.get_product_by_id(db, product_id)
    if not existing:
        raise NotFoundError("Product", product_id)
    updated = await repository.update_product(db, product_id, body.model_dump(exclude_none=True))
    return ProductResponse(**updated)

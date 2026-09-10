from fastapi import APIRouter, Depends, Query
from typing import Optional
import asyncpg

from app.database import get_db
from app.middleware.auth import AuthUser, get_current_user, require_roles
from app.exceptions import NotFoundError
from app.modules.inventory.schemas import (
    StockMovementCreate, StockMovementResponse, InventoryItemResponse, PaginatedMovements,
)
from app.modules.inventory import repository
from app.modules.products import repository as product_repo

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=list[InventoryItemResponse])
async def get_inventory(
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    """Returns all products with current stock levels and low-stock flags."""
    items = await repository.get_inventory(db)
    return [InventoryItemResponse(**item) for item in items]


@router.get("/movements", response_model=PaginatedMovements)
async def list_movements(
    product_id: Optional[str] = Query(None),
    movement_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows, total = await repository.list_movements(db, product_id, movement_type, page, limit)
    return PaginatedMovements(
        data=[StockMovementResponse(**r) for r in rows],
        total=total, page=page, limit=limit,
    )


@router.post("/movements", response_model=StockMovementResponse, status_code=201)
async def record_stock_movement(
    body: StockMovementCreate,
    current_user: AuthUser = Depends(require_roles("ADMIN", "WAREHOUSE")),
    db: asyncpg.Connection = Depends(get_db),
):
    """Manual stock IN. Only ADMIN and WAREHOUSE can record manual movements."""
    product = await product_repo.get_product_by_id(db, body.product_id)
    if not product:
        raise NotFoundError("Product", body.product_id)

    movement = await repository.record_manual_stock_in(
        db, body.product_id, body.quantity, body.reason, current_user.id
    )
    return StockMovementResponse(**movement)

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import asyncpg

from app.database import get_db
from app.middleware.auth import AuthUser, get_current_user, require_roles
from app.exceptions import NotFoundError, InsufficientStockError
from app.modules.challans.schemas import (
    ChallanCreate, ChallanResponse, PaginatedChallans,
)
from app.modules.challans import repository
from app.modules.customers import repository as customer_repo

router = APIRouter(prefix="/challans", tags=["Challans"])


@router.get("", response_model=PaginatedChallans)
async def list_challans(
    status: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows, total = await repository.list_challans(db, status, customer_id, page, limit)
    return PaginatedChallans(
        data=[ChallanResponse(**r) for r in rows],
        total=total, page=page, limit=limit,
    )


@router.get("/{challan_id}", response_model=ChallanResponse)
async def get_challan(
    challan_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    challan = await repository.get_challan_by_id(db, challan_id)
    if not challan:
        raise NotFoundError("Challan", challan_id)
    return ChallanResponse(**challan)


@router.post("", response_model=ChallanResponse, status_code=201)
async def create_challan(
    body: ChallanCreate,
    current_user: AuthUser = Depends(require_roles("ADMIN", "SALES")),
    db: asyncpg.Connection = Depends(get_db),
):
    """Creates a DRAFT challan. Stock is NOT affected."""
    # Verify customer exists
    customer = await customer_repo.get_customer_by_id(db, body.customer_id)
    if not customer:
        raise NotFoundError("Customer", body.customer_id)

    try:
        challan = await repository.create_draft_challan(
            db,
            customer_id=body.customer_id,
            items_input=[item.model_dump() for item in body.items],
            created_by=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ChallanResponse(**challan)


@router.post("/{challan_id}/confirm", response_model=ChallanResponse)
async def confirm_challan(
    challan_id: str,
    current_user: AuthUser = Depends(require_roles("ADMIN", "SALES")),
    db: asyncpg.Connection = Depends(get_db),
):
    """
    Confirms a DRAFT challan. Atomically checks stock and deducts inventory.
    Returns 400 if any product has insufficient stock.
    """
    challan = await repository.get_challan_by_id(db, challan_id)
    if not challan:
        raise NotFoundError("Challan", challan_id)

    try:
        confirmed = await repository.confirm_challan(db, challan_id)
    except InsufficientStockError as e:
        raise HTTPException(status_code=400, detail={"error": e.message, **e.detail})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ChallanResponse(**confirmed)


@router.post("/{challan_id}/cancel", response_model=ChallanResponse)
async def cancel_challan(
    challan_id: str,
    current_user: AuthUser = Depends(require_roles("ADMIN")),
    db: asyncpg.Connection = Depends(get_db),
):
    """
    Cancels a challan. If CONFIRMED, stock is restored.
    Only ADMIN can cancel challans.
    """
    challan = await repository.get_challan_by_id(db, challan_id)
    if not challan:
        raise NotFoundError("Challan", challan_id)

    try:
        cancelled = await repository.cancel_challan(db, challan_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ChallanResponse(**cancelled)

from fastapi import APIRouter, Depends, Query
from typing import Optional
import asyncpg

from app.database import get_db
from app.middleware.auth import AuthUser, get_current_user, require_roles
from app.exceptions import NotFoundError
from app.modules.customers.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    FollowupCreate, FollowupResponse, PaginatedCustomers,
)
from app.modules.customers import repository

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=PaginatedCustomers)
async def list_customers(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows, total = await repository.list_customers(db, search, status, page, limit)
    return PaginatedCustomers(
        data=[CustomerResponse(**{**r, "id": str(r["id"])}) for r in rows],
        total=total, page=page, limit=limit,
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    customer = await repository.get_customer_by_id(db, customer_id)
    if not customer:
        raise NotFoundError("Customer", customer_id)
    return CustomerResponse(**{**customer, "id": str(customer["id"])})


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    body: CustomerCreate,
    current_user: AuthUser = Depends(require_roles("ADMIN", "SALES")),
    db: asyncpg.Connection = Depends(get_db),
):
    customer = await repository.create_customer(db, body.model_dump(), current_user.id)
    return CustomerResponse(**{**customer, "id": str(customer["id"])})


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    body: CustomerUpdate,
    current_user: AuthUser = Depends(require_roles("ADMIN", "SALES")),
    db: asyncpg.Connection = Depends(get_db),
):
    existing = await repository.get_customer_by_id(db, customer_id)
    if not existing:
        raise NotFoundError("Customer", customer_id)
    updated = await repository.update_customer(db, customer_id, body.model_dump(exclude_none=True))
    return CustomerResponse(**{**updated, "id": str(updated["id"])})


@router.post("/{customer_id}/followups", response_model=FollowupResponse, status_code=201)
async def add_followup(
    customer_id: str,
    body: FollowupCreate,
    current_user: AuthUser = Depends(require_roles("ADMIN", "SALES")),
    db: asyncpg.Connection = Depends(get_db),
):
    existing = await repository.get_customer_by_id(db, customer_id)
    if not existing:
        raise NotFoundError("Customer", customer_id)
    followup = await repository.add_followup(
        db, customer_id, body.note, body.follow_up_date, current_user.id
    )
    return FollowupResponse(**{
        **followup,
        "id": str(followup["id"]),
        "customer_id": str(followup["customer_id"]),
        "created_by": str(followup["created_by"]) if followup["created_by"] else None,
    })


@router.get("/{customer_id}/followups", response_model=list[FollowupResponse])
async def list_followups(
    customer_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    existing = await repository.get_customer_by_id(db, customer_id)
    if not existing:
        raise NotFoundError("Customer", customer_id)
    followups = await repository.list_followups(db, customer_id)
    return [
        FollowupResponse(**{
            **f,
            "id": str(f["id"]),
            "customer_id": str(f["customer_id"]),
            "created_by": str(f["created_by"]) if f["created_by"] else None,
        })
        for f in followups
    ]

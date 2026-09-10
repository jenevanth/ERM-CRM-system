from fastapi import APIRouter, Depends
import asyncpg
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.middleware.auth import AuthUser, get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    total_customers: int
    total_products: int
    low_stock_count: int
    today_challans: int
    recent_challans: list[dict]
    upcoming_followups: list[dict]
    low_stock_products: list[dict]


@router.get("", response_model=DashboardStats)
async def get_dashboard(
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    today = datetime.now().date()

    total_customers = (await db.fetchrow("SELECT COUNT(*) FROM customers"))["count"]
    total_products = (await db.fetchrow("SELECT COUNT(*) FROM products"))["count"]
    low_stock_count = (await db.fetchrow(
        "SELECT COUNT(*) FROM products WHERE current_stock <= minimum_stock"
    ))["count"]
    today_challans = (await db.fetchrow(
        "SELECT COUNT(*) FROM challans WHERE DATE(created_at) = $1", today
    ))["count"]

    recent_rows = await db.fetch(
        """
        SELECT ch.id, ch.challan_number, c.name AS customer_name,
               ch.total_quantity, ch.status, ch.created_at
        FROM challans ch
        LEFT JOIN customers c ON ch.customer_id = c.id
        ORDER BY ch.created_at DESC LIMIT 5
        """
    )
    recent_challans = [
        {**dict(r), "id": str(r["id"])}
        for r in recent_rows
    ]

    followup_rows = await db.fetch(
        """
        SELECT id, name, follow_up_date, mobile
        FROM customers
        WHERE follow_up_date BETWEEN $1 AND ($1 + INTERVAL '7 days')
        ORDER BY follow_up_date ASC LIMIT 5
        """,
        today,
    )
    upcoming_followups = [
        {**dict(r), "id": str(r["id"])}
        for r in followup_rows
    ]

    low_stock_rows = await db.fetch(
        """
        SELECT id, name, sku, current_stock, minimum_stock
        FROM products
        WHERE current_stock <= minimum_stock
        ORDER BY current_stock ASC LIMIT 5
        """
    )
    low_stock_products = [
        {**dict(r), "id": str(r["id"])}
        for r in low_stock_rows
    ]

    return DashboardStats(
        total_customers=total_customers,
        total_products=total_products,
        low_stock_count=low_stock_count,
        today_challans=today_challans,
        recent_challans=recent_challans,
        upcoming_followups=upcoming_followups,
        low_stock_products=low_stock_products,
    )

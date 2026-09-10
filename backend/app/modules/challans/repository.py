"""
Challan Repository

This module contains the most critical business logic in the entire application:
the transactional challan confirmation that ensures stock never goes negative.

KEY RULES:
- Draft creation: NO stock changes, NO stock checks
- Confirmation: transactional — check all stock first, then update all atomically
- Cancellation: if CONFIRMED, restore stock with IN movements
"""
from typing import Optional
import asyncpg

from app.exceptions import InsufficientStockError
from app.modules.challans.utils import generate_challan_number


def _format_challan(row: dict, items: list[dict] = None) -> dict:
    return {
        **dict(row),
        "id": str(row["id"]),
        "customer_id": str(row["customer_id"]),
        "created_by": str(row["created_by"]) if row.get("created_by") else None,
        "items": [_format_item(i) for i in (items or [])],
    }


def _format_item(row: dict) -> dict:
    return {
        **dict(row),
        "id": str(row["id"]),
        "challan_id": str(row["challan_id"]),
        "product_id": str(row["product_id"]) if row.get("product_id") else None,
    }


async def _get_items(db: asyncpg.Connection, challan_id: str) -> list[dict]:
    rows = await db.fetch(
        """
        SELECT id, challan_id, product_id, product_name_snapshot, sku_snapshot,
               unit_price_snapshot, quantity
        FROM challan_items WHERE challan_id = $1
        """,
        challan_id,
    )
    return [_format_item(dict(r)) for r in rows]


async def list_challans(
    db: asyncpg.Connection,
    status: Optional[str],
    customer_id: Optional[str],
    page: int,
    limit: int,
) -> tuple[list[dict], int]:
    offset = (page - 1) * limit
    conditions = []
    params = []

    if status:
        params.append(status)
        conditions.append(f"ch.status = ${len(params)}")
    if customer_id:
        params.append(customer_id)
        conditions.append(f"ch.customer_id = ${len(params)}")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_row = await db.fetchrow(f"SELECT COUNT(*) FROM challans ch {where}", *params)
    total = count_row["count"]

    params.extend([limit, offset])
    rows = await db.fetch(
        f"""
        SELECT ch.id, ch.challan_number, ch.customer_id, c.name AS customer_name,
               ch.total_quantity, ch.status, ch.created_by, ch.created_at
        FROM challans ch
        LEFT JOIN customers c ON ch.customer_id = c.id
        {where}
        ORDER BY ch.created_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)}
        """,
        *params,
    )
    return [_format_challan(dict(r)) for r in rows], total


async def get_challan_by_id(db: asyncpg.Connection, challan_id: str) -> Optional[dict]:
    row = await db.fetchrow(
        """
        SELECT ch.id, ch.challan_number, ch.customer_id, c.name AS customer_name,
               ch.total_quantity, ch.status, ch.created_by, ch.created_at
        FROM challans ch
        LEFT JOIN customers c ON ch.customer_id = c.id
        WHERE ch.id = $1
        """,
        challan_id,
    )
    if not row:
        return None
    items = await _get_items(db, challan_id)
    return _format_challan(dict(row), items)


async def create_draft_challan(
    db: asyncpg.Connection,
    customer_id: str,
    items_input: list[dict],
    created_by: str,
) -> dict:
    """
    Creates a DRAFT challan with product snapshot data.
    Does NOT touch stock — drafts have zero stock impact.
    """
    async with db.transaction():
        challan_number = await generate_challan_number(db)

        # Fetch product snapshots for all items
        total_quantity = 0
        enriched_items = []
        for item in items_input:
            product = await db.fetchrow(
                "SELECT id, name, sku, unit_price FROM products WHERE id = $1",
                item["product_id"],
            )
            if not product:
                raise ValueError(f"Product '{item['product_id']}' not found")
            enriched_items.append({
                "product_id": item["product_id"],
                "product_name_snapshot": product["name"],
                "sku_snapshot": product["sku"],
                "unit_price_snapshot": product["unit_price"],
                "quantity": item["quantity"],
            })
            total_quantity += item["quantity"]

        challan_row = await db.fetchrow(
            """
            INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
            VALUES ($1, $2, $3, 'DRAFT', $4)
            RETURNING id, challan_number, customer_id, total_quantity, status, created_by, created_at
            """,
            challan_number, customer_id, total_quantity, created_by,
        )
        challan_id = challan_row["id"]

        for item in enriched_items:
            await db.execute(
                """
                INSERT INTO challan_items
                  (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                challan_id, item["product_id"], item["product_name_snapshot"],
                item["sku_snapshot"], item["unit_price_snapshot"], item["quantity"],
            )

    # Fetch the full record outside the transaction
    return await get_challan_by_id(db, str(challan_id))


async def confirm_challan(db: asyncpg.Connection, challan_id: str) -> dict:
    """
    THE CRITICAL TRANSACTIONAL OPERATION.

    Steps inside a single DB transaction:
    1. Lock the challan row (prevent concurrent confirmation)
    2. Validate challan is in DRAFT state
    3. Lock all product rows FOR UPDATE (prevent race conditions)
    4. Check every item's quantity against current stock
    5. If ANY product has insufficient stock → ROLLBACK → raise InsufficientStockError
    6. Deduct stock from every product
    7. Insert OUT stock_movement for every item
    8. Update challan status to CONFIRMED
    """
    async with db.transaction():
        # Lock the challan row
        challan = await db.fetchrow(
            "SELECT id, status FROM challans WHERE id = $1 FOR UPDATE",
            challan_id,
        )
        if not challan:
            raise ValueError(f"Challan '{challan_id}' not found")
        if challan["status"] != "DRAFT":
            raise ValueError(f"Only DRAFT challans can be confirmed. Current status: {challan['status']}")

        # Fetch items
        items = await db.fetch(
            "SELECT product_id, product_name_snapshot, quantity FROM challan_items WHERE challan_id = $1",
            challan_id,
        )

        # Lock product rows and check stock
        for item in items:
            product = await db.fetchrow(
                "SELECT id, name, current_stock FROM products WHERE id = $1 FOR UPDATE",
                item["product_id"],
            )
            if not product:
                raise ValueError(f"Product not found: {item['product_id']}")
            if product["current_stock"] < item["quantity"]:
                raise InsufficientStockError(
                    product_name=product["name"],
                    available=product["current_stock"],
                    requested=item["quantity"],
                )

        # All checks passed — deduct stock and record movements
        challan_row = await db.fetchrow(
            "SELECT challan_number FROM challans WHERE id = $1", challan_id
        )
        for item in items:
            await db.execute(
                "UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2",
                item["quantity"], item["product_id"],
            )
            await db.execute(
                """
                INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
                SELECT $1, $2, 'OUT', $3, created_by FROM challans WHERE id = $4
                """,
                item["product_id"], item["quantity"],
                f"Sales Challan {challan_row['challan_number']}",
                challan_id,
            )

        await db.execute(
            "UPDATE challans SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1",
            challan_id,
        )

    return await get_challan_by_id(db, str(challan_id))


async def cancel_challan(db: asyncpg.Connection, challan_id: str) -> dict:
    """
    Cancels a challan.
    - DRAFT → CANCELLED: no stock change
    - CONFIRMED → CANCELLED: restore stock + create IN movements
    """
    async with db.transaction():
        challan = await db.fetchrow(
            "SELECT id, status FROM challans WHERE id = $1 FOR UPDATE",
            challan_id,
        )
        if not challan:
            raise ValueError(f"Challan '{challan_id}' not found")
        if challan["status"] == "CANCELLED":
            raise ValueError("Challan is already cancelled")

        if challan["status"] == "CONFIRMED":
            # Restore stock for each item
            items = await db.fetch(
                "SELECT product_id, product_name_snapshot, quantity FROM challan_items WHERE challan_id = $1",
                challan_id,
            )
            challan_row = await db.fetchrow(
                "SELECT challan_number FROM challans WHERE id = $1", challan_id
            )
            for item in items:
                await db.execute(
                    "UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2",
                    item["quantity"], item["product_id"],
                )
                await db.execute(
                    """
                    INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
                    SELECT $1, $2, 'IN', $3, created_by FROM challans WHERE id = $4
                    """,
                    item["product_id"], item["quantity"],
                    f"Cancellation of Challan {challan_row['challan_number']}",
                    challan_id,
                )

        await db.execute(
            "UPDATE challans SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1",
            challan_id,
        )

    return await get_challan_by_id(db, str(challan_id))

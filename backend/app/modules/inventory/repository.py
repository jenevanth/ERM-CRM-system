from typing import Optional
import asyncpg


async def get_inventory(db: asyncpg.Connection) -> list[dict]:
    rows = await db.fetch(
        """
        SELECT id, name, sku, category, unit_price, current_stock, minimum_stock, warehouse
        FROM products
        ORDER BY name ASC
        """
    )
    return [
        {**dict(r), "id": str(r["id"]), "is_low_stock": r["current_stock"] <= r["minimum_stock"]}
        for r in rows
    ]


async def list_movements(
    db: asyncpg.Connection,
    product_id: Optional[str],
    movement_type: Optional[str],
    page: int,
    limit: int,
) -> tuple[list[dict], int]:
    offset = (page - 1) * limit
    conditions = []
    params = []

    if product_id:
        params.append(product_id)
        conditions.append(f"sm.product_id = ${len(params)}")
    if movement_type:
        params.append(movement_type)
        conditions.append(f"sm.movement_type = ${len(params)}")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_row = await db.fetchrow(
        f"SELECT COUNT(*) FROM stock_movements sm {where}", *params
    )
    total = count_row["count"]

    params.extend([limit, offset])
    rows = await db.fetch(
        f"""
        SELECT sm.id, sm.product_id, p.name AS product_name, sm.quantity,
               sm.movement_type, sm.reason, sm.created_by, sm.created_at
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        {where}
        ORDER BY sm.created_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)}
        """,
        *params,
    )
    return [
        {
            **dict(r),
            "id": str(r["id"]),
            "product_id": str(r["product_id"]),
            "created_by": str(r["created_by"]) if r["created_by"] else None,
        }
        for r in rows
    ], total


async def record_manual_stock_in(
    db: asyncpg.Connection,
    product_id: str,
    quantity: int,
    reason: Optional[str],
    created_by: str,
) -> dict:
    """
    Records a manual IN movement and updates current_stock.
    Uses a transaction for atomicity.
    """
    async with db.transaction():
        await db.execute(
            "UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2",
            quantity, product_id,
        )
        row = await db.fetchrow(
            """
            INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
            VALUES ($1, $2, 'IN', $3, $4)
            RETURNING id, product_id, quantity, movement_type, reason, created_by, created_at
            """,
            product_id, quantity, reason, created_by,
        )
    return {
        **dict(row),
        "id": str(row["id"]),
        "product_id": str(row["product_id"]),
        "created_by": str(row["created_by"]) if row["created_by"] else None,
        "product_name": None,
    }

from typing import Optional
import asyncpg


def _row_to_product(row: dict) -> dict:
    r = dict(row)
    r["id"] = str(r["id"])
    r["is_low_stock"] = r["current_stock"] <= r["minimum_stock"]
    return r


async def list_products(
    db: asyncpg.Connection,
    search: Optional[str],
    category: Optional[str],
    low_stock_only: bool,
    page: int,
    limit: int,
) -> tuple[list[dict], int]:
    offset = (page - 1) * limit
    conditions = []
    params = []

    if search:
        params.append(f"%{search}%")
        conditions.append(f"(name ILIKE ${len(params)} OR sku ILIKE ${len(params)})")
    if category:
        params.append(category)
        conditions.append(f"category = ${len(params)}")
    if low_stock_only:
        conditions.append("current_stock <= minimum_stock")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_row = await db.fetchrow(f"SELECT COUNT(*) FROM products {where}", *params)
    total = count_row["count"]

    params.extend([limit, offset])
    rows = await db.fetch(
        f"""
        SELECT id, name, sku, category, unit_price, current_stock, minimum_stock,
               warehouse, created_at, updated_at
        FROM products {where}
        ORDER BY name ASC
        LIMIT ${len(params) - 1} OFFSET ${len(params)}
        """,
        *params,
    )
    return [_row_to_product(dict(r)) for r in rows], total


async def get_product_by_id(db: asyncpg.Connection, product_id: str) -> Optional[dict]:
    row = await db.fetchrow(
        "SELECT id, name, sku, category, unit_price, current_stock, minimum_stock, warehouse, created_at, updated_at FROM products WHERE id = $1",
        product_id,
    )
    return _row_to_product(dict(row)) if row else None


async def create_product(db: asyncpg.Connection, data: dict, created_by: str) -> dict:
    row = await db.fetchrow(
        """
        INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id, name, sku, category, unit_price, current_stock, minimum_stock, warehouse, created_at, updated_at
        """,
        data["name"], data["sku"], data["category"], data["unit_price"],
        data.get("current_stock", 0), data.get("minimum_stock", 0),
        data.get("warehouse", "North Hub Bay 3"),
    )
    return _row_to_product(dict(row))


async def update_product(db: asyncpg.Connection, product_id: str, data: dict) -> Optional[dict]:
    field_map = ["name", "sku", "category", "unit_price", "minimum_stock", "warehouse"]
    set_clauses = []
    params = []
    for field in field_map:
        if field in data:
            params.append(data[field])
            set_clauses.append(f"{field} = ${len(params)}")

    if not set_clauses:
        return await get_product_by_id(db, product_id)

    params.append(product_id)
    row = await db.fetchrow(
        f"""
        UPDATE products
        SET {", ".join(set_clauses)}, updated_at = NOW()
        WHERE id = ${len(params)}
        RETURNING id, name, sku, category, unit_price, current_stock, minimum_stock, warehouse, created_at, updated_at
        """,
        *params,
    )
    return _row_to_product(dict(row)) if row else None

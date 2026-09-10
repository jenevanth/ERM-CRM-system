from typing import Optional
import asyncpg


async def list_customers(
    db: asyncpg.Connection,
    search: Optional[str],
    status: Optional[str],
    page: int,
    limit: int,
) -> tuple[list[dict], int]:
    offset = (page - 1) * limit
    conditions = []
    params = []

    if search:
        params.append(f"%{search}%")
        conditions.append(
            f"(c.name ILIKE ${len(params)} OR c.business_name ILIKE ${len(params)} OR c.mobile ILIKE ${len(params)})"
        )
    if status:
        params.append(status)
        conditions.append(f"c.status = ${len(params)}")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_row = await db.fetchrow(
        f"SELECT COUNT(*) FROM customers c {where}", *params
    )
    total = count_row["count"]

    params.extend([limit, offset])
    rows = await db.fetch(
        f"""
        SELECT c.id, c.name, c.mobile, c.email, c.business_name, c.gst_number,
               c.customer_type, c.address, c.status, c.follow_up_date, c.notes,
               c.created_at, c.updated_at
        FROM customers c
        {where}
        ORDER BY c.created_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)}
        """,
        *params,
    )
    return [dict(r) for r in rows], total


async def get_customer_by_id(db: asyncpg.Connection, customer_id: str) -> Optional[dict]:
    row = await db.fetchrow(
        """
        SELECT id, name, mobile, email, business_name, gst_number,
               customer_type, address, status, follow_up_date, notes,
               created_at, updated_at
        FROM customers WHERE id = $1
        """,
        customer_id,
    )
    return dict(row) if row else None


async def create_customer(db: asyncpg.Connection, data: dict, created_by: str) -> dict:
    row = await db.fetchrow(
        """
        INSERT INTO customers (name, mobile, email, business_name, gst_number,
            customer_type, address, status, follow_up_date, notes, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING id, name, mobile, email, business_name, gst_number,
                  customer_type, address, status, follow_up_date, notes, created_at, updated_at
        """,
        data.get("name"), data.get("mobile"), data.get("email"),
        data.get("business_name"), data.get("gst_number"), data.get("customer_type"),
        data.get("address"), data.get("status"), data.get("follow_up_date"),
        data.get("notes"), created_by,
    )
    return dict(row)


async def update_customer(db: asyncpg.Connection, customer_id: str, data: dict) -> Optional[dict]:
    # Build dynamic SET clause from only the provided fields
    set_clauses = []
    params = []
    field_map = {
        "name": "name", "mobile": "mobile", "email": "email",
        "business_name": "business_name", "gst_number": "gst_number",
        "customer_type": "customer_type", "address": "address",
        "status": "status", "follow_up_date": "follow_up_date", "notes": "notes",
    }
    for field, col in field_map.items():
        if field in data and data[field] is not None:
            params.append(data[field])
            set_clauses.append(f"{col} = ${len(params)}")

    if not set_clauses:
        return await get_customer_by_id(db, customer_id)

    params.append(customer_id)
    row = await db.fetchrow(
        f"""
        UPDATE customers
        SET {", ".join(set_clauses)}, updated_at = NOW()
        WHERE id = ${len(params)}
        RETURNING id, name, mobile, email, business_name, gst_number,
                  customer_type, address, status, follow_up_date, notes, created_at, updated_at
        """,
        *params,
    )
    return dict(row) if row else None


async def add_followup(
    db: asyncpg.Connection, customer_id: str, note: str, follow_up_date, created_by: str
) -> dict:
    row = await db.fetchrow(
        """
        INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, customer_id, note, follow_up_date, created_by, created_at
        """,
        customer_id, note, follow_up_date, created_by,
    )
    return dict(row)


async def list_followups(db: asyncpg.Connection, customer_id: str) -> list[dict]:
    rows = await db.fetch(
        """
        SELECT id, customer_id, note, follow_up_date, created_by, created_at
        FROM customer_followups
        WHERE customer_id = $1
        ORDER BY created_at DESC
        """,
        customer_id,
    )
    return [dict(r) for r in rows]

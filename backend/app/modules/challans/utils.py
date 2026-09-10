from datetime import datetime
import asyncpg


async def generate_challan_number(db: asyncpg.Connection) -> str:
    """
    Generates a unique challan number in the format CH-YYYYMMDD-XXXX.
    Finds the highest sequence for today and increments it.
    Thread-safe because asyncpg handles connection-level serialization.
    """
    today_prefix = f"CH-{datetime.now().strftime('%Y%m%d')}-"
    row = await db.fetchrow(
        "SELECT challan_number FROM challans WHERE challan_number LIKE $1 ORDER BY challan_number DESC LIMIT 1",
        f"{today_prefix}%",
    )
    if row:
        last_seq = int(row["challan_number"].split("-")[-1])
        next_seq = last_seq + 1
    else:
        next_seq = 1
    return f"{today_prefix}{str(next_seq).zfill(4)}"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import get_pool, close_pool
from app.exceptions import AppError
from app.middleware.error_handler import app_error_handler, generic_error_handler

# Routers
from app.modules.auth.router import router as auth_router
from app.modules.customers.router import router as customers_router
from app.modules.products.router import router as products_router
from app.modules.inventory.router import router as inventory_router
from app.modules.challans.router import router as challans_router
from app.modules.dashboard.router import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up the DB connection pool
    await get_pool()
    print("✅ Database connection pool ready")
    yield
    # Shutdown: close all connections
    await close_pool()
    print("🔌 Database connection pool closed")


app = FastAPI(
    title="Apex Wholesale ERP — API",
    description="Mini ERP + CRM backend for a wholesale distribution company. "
                "Manages customers, products, inventory, and sales challans with role-based access.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add prod URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

# Register all routers under /api prefix
API_PREFIX = "/api"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(customers_router, prefix=API_PREFIX)
app.include_router(products_router, prefix=API_PREFIX)
app.include_router(inventory_router, prefix=API_PREFIX)
app.include_router(challans_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint — confirms the API is running."""
    from app.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        db_time = await conn.fetchval("SELECT NOW()")
    return {"status": "ok", "database": str(db_time)}

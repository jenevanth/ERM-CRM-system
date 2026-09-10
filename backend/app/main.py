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

# CORS — allow React frontend (local and Vercel production) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://erm-crm-system.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API service directory and documentation links."""
    return {
        "service": "Apex Wholesale Operations Portal API",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs",
        "alternative_docs": "/redoc",
        "health_check": "/health",
        "api_base": "/api",
    }

# Global error handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

# Register all routers under /api prefix
# Note: each router already has its own prefix set (e.g. prefix="/customers")
# so we only add /api here — resulting in e.g. /api/customers
API_PREFIX = "/api"
app.include_router(auth_router, prefix=API_PREFIX)       # → /api/auth/...
app.include_router(customers_router, prefix=API_PREFIX)  # → /api/customers/...
app.include_router(products_router, prefix=API_PREFIX)   # → /api/products/...
app.include_router(inventory_router, prefix=API_PREFIX)  # → /api/inventory/...
app.include_router(challans_router, prefix=API_PREFIX)   # → /api/challans/...
app.include_router(dashboard_router, prefix=API_PREFIX)  # → /api/dashboard/...


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint — confirms the API is running."""
    from app.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        db_time = await conn.fetchval("SELECT NOW()")
    return {"status": "ok", "database": str(db_time)}

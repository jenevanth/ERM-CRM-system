from fastapi import APIRouter, Depends
import asyncpg

from app.database import get_db
from app.middleware.auth import AuthUser, get_current_user
from app.modules.auth.schemas import ProfileCreate, ProfileResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", response_model=ProfileResponse)
async def get_me(current_user: AuthUser = Depends(get_current_user)):
    """Returns the authenticated user's profile and role."""
    return ProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
    )


@router.post("/profile", response_model=ProfileResponse, status_code=201)
async def create_profile(
    body: ProfileCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    """
    Called once after initial Supabase signup to create the profile row.
    Only creates/updates the profile for the currently authenticated user.
    """
    row = await db.fetchrow(
        """
        INSERT INTO profiles (id, full_name, email, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
          SET full_name = EXCLUDED.full_name,
              email = EXCLUDED.email,
              role = EXCLUDED.role
        RETURNING id, full_name, email, role
        """,
        current_user.id,
        body.full_name,
        body.email,
        body.role,
    )
    return ProfileResponse(**dict(row))

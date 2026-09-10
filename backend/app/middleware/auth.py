from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
import asyncpg

from app.config import get_settings
from app.database import get_db
from app.exceptions import ForbiddenError, UnauthorizedError

security = HTTPBearer()


class AuthUser:
    """Represents the currently authenticated user attached to each request."""
    def __init__(self, id: str, email: str, role: str, full_name: str):
        self.id = id
        self.email = email
        self.role = role
        self.full_name = full_name


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: asyncpg.Connection = Depends(get_db),
) -> AuthUser:
    """
    FastAPI dependency.
    1. Decodes the Supabase JWT from the Authorization header.
    2. Extracts the user ID (sub claim).
    3. Fetches the profile row (including role) from the DB.
    Returns an AuthUser or raises 401.
    """
    settings = get_settings()
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase uses 'authenticated' as aud
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token: missing subject")
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Load role from our profiles table
    row = await db.fetchrow(
        "SELECT id, email, full_name, role FROM profiles WHERE id = $1",
        user_id,
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User profile not found. Please complete signup.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthUser(
        id=str(row["id"]),
        email=row["email"],
        role=row["role"],
        full_name=row["full_name"],
    )


def require_roles(*roles: str):
    """
    Returns a FastAPI dependency that enforces role-based access.
    Usage: Depends(require_roles("ADMIN", "SALES"))
    """
    async def _check(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}. Your role: {current_user.role}",
            )
        return current_user
    return _check

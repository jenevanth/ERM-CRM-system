from pydantic import BaseModel, EmailStr
from typing import Literal

RoleType = Literal["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"]


class ProfileCreate(BaseModel):
    full_name: str
    email: EmailStr
    role: RoleType


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str

from pydantic import BaseModel, EmailStr
from typing import Literal, Optional, Union
from datetime import date, datetime

CustomerType = Literal["RETAIL", "WHOLESALE", "DISTRIBUTOR"]
CustomerStatus = Literal["LEAD", "ACTIVE", "INACTIVE"]


class CustomerCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[EmailStr] = None
    business_name: Optional[str] = None
    gst_number: Optional[str] = None
    customer_type: CustomerType
    address: Optional[str] = None
    status: CustomerStatus = "LEAD"
    follow_up_date: Optional[Union[datetime, date]] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    business_name: Optional[str] = None
    gst_number: Optional[str] = None
    customer_type: Optional[CustomerType] = None
    address: Optional[str] = None
    status: Optional[CustomerStatus] = None
    follow_up_date: Optional[Union[datetime, date]] = None
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    mobile: str
    email: Optional[str]
    business_name: Optional[str]
    gst_number: Optional[str]
    customer_type: str
    address: Optional[str]
    status: str
    follow_up_date: Optional[Union[datetime, date]]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class FollowupCreate(BaseModel):
    note: str
    follow_up_date: Optional[Union[datetime, date]] = None


class FollowupResponse(BaseModel):
    id: str
    customer_id: str
    note: str
    follow_up_date: Optional[Union[datetime, date]]
    created_by: Optional[str]
    created_at: datetime


class PaginatedCustomers(BaseModel):
    data: list[CustomerResponse]
    total: int
    page: int
    limit: int

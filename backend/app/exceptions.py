from typing import Any, Optional


class AppError(Exception):
    """Base application error."""
    def __init__(self, message: str, status_code: int = 400, detail: Any = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: Optional[str] = None):
        msg = f"{resource} not found"
        if resource_id:
            msg = f"{resource} '{resource_id}' not found"
        super().__init__(msg, status_code=404)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=401)


class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(message, status_code=403)


class ValidationError(AppError):
    def __init__(self, message: str, detail: Any = None):
        super().__init__(message, status_code=400, detail=detail)


class InsufficientStockError(AppError):
    """Raised when a challan confirmation would make stock go negative."""
    def __init__(self, product_name: str, available: int, requested: int):
        super().__init__(
            message=f"Insufficient stock for '{product_name}'",
            status_code=400,
            detail={
                "product": product_name,
                "available": available,
                "requested": requested,
            },
        )

"""Custom exceptions and error responses."""
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class ForgeError(Exception):
    """Base application error."""
    def __init__(self, message: str, status_code: int = 400, detail: dict = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(message)


class NotFoundError(ForgeError):
    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found", status_code=404)


class AuthError(ForgeError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=401)


class ConflictError(ForgeError):
    def __init__(self, message: str = "Conflict"):
        super().__init__(message, status_code=409)


class ValidationError(ForgeError):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status_code=422)


def forge_exception_handler(request: Request, exc: ForgeError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "detail": exc.detail,
            "path": str(request.url.path),
        },
    )


def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "detail": str(exc) if __debug__ else "An unexpected error occurred",
            "path": str(request.url.path),
        },
    )

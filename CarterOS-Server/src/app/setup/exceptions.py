"""
ⒸAngelaMos | 2025
exceptions.py
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.exceptions import BaseAppException
from core.security.rate_limit.limiter import limiter


def setup_exception_handlers(app: FastAPI) -> None:
    """
    Configure exception handlers
    """
    app.state.limiter = limiter
    app.add_exception_handler(
        RateLimitExceeded,
        _rate_limit_exceeded_handler
    )

    @app.exception_handler(BaseAppException)
    async def app_exception_handler(
        request: Request,
        exc: BaseAppException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code = exc.status_code,
            content = {
                "detail": exc.message,
                "type": exc.__class__.__name__,
            },
        )

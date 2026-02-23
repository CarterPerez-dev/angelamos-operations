"""
ⒸAngelaMos | 2025
factory.py
"""

from fastapi import FastAPI

from app.openapi import get_openapi_config
from app.setup.lifespan import lifespan
from app.setup.middleware import setup_middleware
from app.setup.cors import setup_cors
from app.setup.exceptions import setup_exception_handlers
from app.routers import register_routers
from core.integrations.mcp import mcp


def create_app() -> FastAPI:
    """
    Application factory
    """
    app = FastAPI(
        **get_openapi_config(),
        lifespan = lifespan,
    )

    setup_middleware(app)
    setup_cors(app)
    setup_exception_handlers(app)
    register_routers(app)

    app.mount("/mcp", mcp.sse_app())

    return app

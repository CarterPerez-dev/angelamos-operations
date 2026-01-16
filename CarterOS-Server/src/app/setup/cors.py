"""
ⒸAngelaMos | 2025
cors.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings


def setup_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins = settings.CORS_ORIGINS,
        allow_credentials = settings.CORS_ALLOW_CREDENTIALS,
        allow_methods = settings.CORS_ALLOW_METHODS,
        allow_headers = settings.CORS_ALLOW_HEADERS,
    )

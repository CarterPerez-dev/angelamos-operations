"""
ⒸAngelaMos | 2025
openapi.py
"""

from config import settings, Environment


OPENAPI_TAGS = [
    {
        "name": "root",
        "description": "API information"
    },
    {
        "name": "health",
        "description": "Health check endpoints"
    },
    {
        "name": "auth",
        "description": "Authentication and authorization"
    },
    {
        "name": "users",
        "description": "User registration and profile management"
    },
    {
        "name": "admin",
        "description": "Admin only operations"
    },
    {
        "name": "Challenge Tracker",
        "description": "1500/1000 challenge tracking"
    },
    {
        "name": "Job Application Tracker",
        "description": "Job hunt lifecycle tracking"
    },
]


def get_openapi_config() -> dict:
    """
    Build OpenAPI configuration
    """
    is_production = settings.ENVIRONMENT == Environment.PRODUCTION

    return {
        "title": settings.APP_NAME,
        "summary": settings.APP_SUMMARY,
        "description": settings.APP_DESCRIPTION,
        "version": settings.APP_VERSION,
        "contact": {
            "name": settings.APP_CONTACT_NAME,
            "email": settings.APP_CONTACT_EMAIL,
        },
        "license_info": {
            "name": settings.APP_LICENSE_NAME,
            "url": settings.APP_LICENSE_URL,
        },
        "openapi_tags": OPENAPI_TAGS,
        "openapi_url": None if is_production else "/openapi.json",
        "docs_url": None if is_production else "/docs",
        "redoc_url": None if is_production else "/redoc",
        "debug": False,
    }

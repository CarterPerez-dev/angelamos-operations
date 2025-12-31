"""
ⒸAngelaMos | 2025
exceptions.py
"""

from typing import Any


class LateApiError(Exception):
    """
    Base exception for Late API errors
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response_data: dict[str, Any] | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}
        super().__init__(self.message)


class LateAuthenticationError(LateApiError):
    """
    Authentication failed (401)
    """

    def __init__(
        self,
        message: str = "Invalid or missing API key",
        response_data: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=401,
            response_data=response_data,
        )


class LateRateLimitError(LateApiError):
    """
    Rate limit exceeded (429)
    """

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: int | None = None,
        response_data: dict[str, Any] | None = None,
    ) -> None:
        self.retry_after = retry_after
        super().__init__(
            message=message,
            status_code=429,
            response_data=response_data,
        )


class LateNotFoundError(LateApiError):
    """
    Resource not found (404)
    """

    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        response_data: dict[str, Any] | None = None,
    ) -> None:
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(
            message=f"{resource_type} not found: {resource_id}",
            status_code=404,
            response_data=response_data,
        )


class LateValidationError(LateApiError):
    """
    Validation error (400)
    """

    def __init__(
        self,
        message: str = "Invalid request",
        errors: list[dict[str, Any]] | None = None,
        response_data: dict[str, Any] | None = None,
    ) -> None:
        self.errors = errors or []
        super().__init__(
            message=message,
            status_code=400,
            response_data=response_data,
        )


class LateConnectionError(LateApiError):
    """
    Connection failed
    """

    def __init__(
        self,
        message: str = "Failed to connect to Late API",
        original_error: Exception | None = None,
    ) -> None:
        self.original_error = original_error
        super().__init__(
            message=message,
            status_code=None,
            response_data=None,
        )

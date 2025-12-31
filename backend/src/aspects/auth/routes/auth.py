"""
ⒸAngelaMos | 2025
auth.py
"""

from typing import Annotated

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    Request,
    Response,
    status,
)
from fastapi.security import (
    OAuth2PasswordRequestForm,
)

from config import settings
from core.security.auth.dependencies import (
    ClientIP,
    CurrentUser,
    DBSession,
)
from core.security.auth.jwt import (
    clear_refresh_cookie,
    set_refresh_cookie,
)
from core.security.rate_limit.limiter import limiter
from core.foundation.exceptions import TokenError
from aspects.auth.schemas.auth import (
    PasswordChange,
    TokenResponse,
    TokenWithUserResponse,
)
from aspects.auth.schemas.user import UserResponse
from aspects.auth.services.auth import AuthService
from aspects.auth.services.user import UserService
from core.foundation.responses import AUTH_401


router = APIRouter(prefix = "/auth", tags = ["auth"])


@router.post(
    "/login",
    response_model = TokenWithUserResponse,
    responses = {**AUTH_401}
)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(
    request: Request,
    response: Response,
    db: DBSession,
    ip: ClientIP,
    form_data: Annotated[OAuth2PasswordRequestForm,
                         Depends()],
) -> TokenWithUserResponse:
    """
    Login with email and password
    """
    result, refresh_token = await AuthService.login(
        db,
        email=form_data.username,
        password=form_data.password,
        ip_address=ip,
    )
    set_refresh_cookie(response, refresh_token)
    return result


@router.post(
    "/refresh",
    response_model = TokenResponse,
    responses = {**AUTH_401}
)
async def refresh_token(
    request: Request,
    response: Response,
    db: DBSession,
    ip: ClientIP,
    refresh_token: str | None = Cookie(None),
) -> TokenResponse:
    """
    Refresh access token
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Refresh endpoint hit - Cookie received: {refresh_token is not None}")
    logger.info(f"All cookies: {request.cookies}")

    if not refresh_token:
        raise TokenError("Refresh token required")
    result, new_refresh_token = await AuthService.refresh_tokens(
        db,
        refresh_token,
        ip_address = ip
    )
    set_refresh_cookie(response, new_refresh_token)
    return result


@router.post(
    "/logout",
    status_code = status.HTTP_204_NO_CONTENT,
    responses = {**AUTH_401}
)
async def logout(
    response: Response,
    db: DBSession,
    refresh_token: str | None = Cookie(None),
) -> None:
    """
    Logout current session
    """
    if not refresh_token:
        raise TokenError("Refresh token required")
    await AuthService.logout(db, refresh_token)
    clear_refresh_cookie(response)


@router.post("/logout-all", responses = {**AUTH_401})
async def logout_all(
    response: Response,
    db: DBSession,
    current_user: CurrentUser,
) -> dict[str,
          int]:
    """
    Logout from all devices
    """
    count = await AuthService.logout_all(db, current_user)
    clear_refresh_cookie(response)
    return {"revoked_sessions": count}


@router.get("/me", response_model = UserResponse, responses = {**AUTH_401})
async def get_current_user(current_user: CurrentUser) -> UserResponse:
    """
    Get current authenticated user
    """
    return UserResponse.model_validate(current_user)


@router.post(
    "/change-password",
    status_code = status.HTTP_204_NO_CONTENT,
    responses = {**AUTH_401}
)
async def change_password(
    db: DBSession,
    current_user: CurrentUser,
    data: PasswordChange,
) -> None:
    """
    Change current user password
    """
    await UserService.change_password(
        db,
        current_user,
        data.current_password,
        data.new_password,
    )

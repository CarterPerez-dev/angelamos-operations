"""
ⒸAngelaMos | 2025
enums.py
"""

from enum import Enum
from typing import Any

import sqlalchemy as sa


def enum_values_callable(enum_class: type[Enum]) -> list[str]:
    """
    Returns enum VALUES (not names) for SQLAlchemy storage

    Prevents the common trap where SQLAlchemy stores enum NAMES by default,
    causing database breakage if you rename an enum member
    """
    return [str(item.value) for item in enum_class]


class SafeEnum(sa.Enum):
    """
    SQLAlchemy Enum type that stores VALUES and handles unknown values gracefully

    https://blog.wrouesnel.com/posts/sqlalchemy-enums-careful-what-goes-into-the-database/
    """
    def __init__(self, *enums: type[Enum], **kw: Any) -> None:
        if "values_callable" not in kw:
            kw["values_callable"] = enum_values_callable
        if "create_type" not in kw:
            kw["create_type"] = False
        super().__init__(*enums, **kw)
        self._unknown_value = (
            kw["_adapted_from"]._unknown_value
            if "_adapted_from" in kw else kw.get("unknown_value")
        )

    def _object_value_for_elem(self, elem: str) -> Enum:
        """
        Override to return unknown_value instead of raising LookupError
        """
        try:
            return self._object_lookup[elem]
        except LookupError:
            if self._unknown_value is not None:
                return self._unknown_value
            raise


class Environment(str, Enum):
    """
    Application environment.
    """
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class UserRole(str, Enum):
    """
    User roles for authorization.
    """
    UNKNOWN = "unknown"
    USER = "user"
    ADMIN = "admin"


class TokenType(str, Enum):
    """
    JWT token types.
    """
    ACCESS = "access"
    REFRESH = "refresh"


class HealthStatus(str, Enum):
    """
    Health check status values.
    """
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"


class ProficiencyLevel(str, Enum):
    """
    Skill proficiency levels
    """
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class PassionLevel(str, Enum):
    """
    Interest passion levels
    """
    INTERESTED = "interested"
    PASSIONATE = "passionate"
    OBSESSED = "obsessed"


class StrengthSource(str, Enum):
    """
    Source of strength identification
    """
    SELF_IDENTIFIED = "self_identified"
    OTHERS_TELL_HIM = "others_tell_him"


class PlatformType(str, Enum):
    """
    Social media platform types
    """
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    REDDIT = "reddit"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"


class PreferenceType(str, Enum):
    """
    Content preference types for identity
    """
    ENGAGEMENT_WINNER = "engagement_winner"
    PERSONAL_ENJOYMENT = "personal_enjoyment"
    BURNT_OUT_ON = "burnt_out_on"
    WANTS_TO_MAKE = "wants_to_make"


class EngagementLevel(str, Enum):
    """
    Engagement levels for content
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VIRAL = "viral"


class ForbiddenPatternType(str, Enum):
    """
    AI detection pattern types for Reddit
    """
    EM_DASH = "em_dash"
    HYPHEN = "hyphen"
    AI_LANGUAGE = "ai_language"


class PatternSeverity(str, Enum):
    """
    Severity level of forbidden patterns
    """
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

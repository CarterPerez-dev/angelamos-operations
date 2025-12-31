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


class PlatformType(str, Enum):
    """
    Social media platform types (all Late API supported platforms)
    """
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    REDDIT = "reddit"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    PINTEREST = "pinterest"
    BLUESKY = "bluesky"
    THREADS = "threads"
    GOOGLE_BUSINESS = "google_business"


class ContentType(str, Enum):
    """
    Content format types
    """
    VIDEO = "video"
    POST = "post"
    THREAD = "thread"
    SHORT = "short"


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


class PreferenceType(str, Enum):
    """
    Content preference categories
    """
    ENGAGEMENT_WINNER = "engagement_winner"
    PERSONAL_ENJOYMENT = "personal_enjoyment"
    BURNT_OUT_ON = "burnt_out_on"
    WANTS_TO_MAKE = "wants_to_make"


class EngagementLevel(str, Enum):
    """
    Content engagement performance levels
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VIRAL = "viral"


class SubredditPriority(str, Enum):
    """
    Reddit subreddit priority levels
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    HIGHEST = "highest"


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


class TikTokRuleCategory(str, Enum):
    """
    TikTok rule categories
    """
    VIDEO_LENGTH = "video_length"
    VISUAL_STYLE = "visual_style"
    HOOKS = "hooks"
    SENTENCE_STRUCTURE = "sentence_structure"
    CTA = "cta"


class LinkedInPageType(str, Enum):
    """
    LinkedIn page types
    """
    PERSONAL = "personal"
    COMPANY = "company"


class TikTokHookType(str, Enum):
    """
    TikTok three-hook system types
    """
    VISUAL = "visual"
    TEXT = "text"
    VERBAL = "verbal"


class TikTokMistakeType(str, Enum):
    """
    TikTok mistake categories
    """
    RETENTION_KILLER = "retention_killer"
    ALGORITHM_ERROR = "algorithm_error"


class WorkflowMode(str, Enum):
    """
    Content generation workflow modes
    """
    GIVE_ME_IDEAS = "give_me_ideas"
    I_HAVE_IDEA = "i_have_idea"


class WorkflowStage(str, Enum):
    """
    Content generation workflow stages
    """
    IDEAS = "ideas"
    HOOKS = "hooks"
    HOOK_ANALYSIS = "hook_analysis"
    TITLES = "titles"
    TITLE_ANALYSIS = "title_analysis"
    SCRIPT = "script"
    SCRIPT_ANALYSIS = "script_analysis"
    STRUCTURE = "structure"
    STRUCTURE_ANALYSIS = "structure_analysis"
    BODY = "body"
    BODY_ANALYSIS = "body_analysis"
    CONTENT = "content"
    CONTENT_ANALYSIS = "content_analysis"
    FINAL_REVIEW = "final_review"


class ContentStatus(str, Enum):
    """
    Content publishing status
    """
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    DELETED = "deleted"


class GeneratedContentStatus(str, Enum):
    """
    Generated content workflow status
    """
    GENERATED = "generated"
    USER_MODIFIED = "user_modified"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ScheduleStatus(str, Enum):
    """
    Scheduled post status in the scheduling workflow
    """
    DRAFT = "draft"
    PENDING_SYNC = "pending_sync"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"


class LatePostStatus(str, Enum):
    """
    Post status as reported by Late API
    """
    PENDING = "pending"
    PROCESSING = "processing"
    PUBLISHED = "published"
    FAILED = "failed"
    PARTIAL = "partial"


class MediaType(str, Enum):
    """
    Media attachment types
    """
    IMAGE = "image"
    VIDEO = "video"
    GIF = "gif"
    DOCUMENT = "document"
    THUMBNAIL = "thumbnail"


class ScheduleMode(str, Enum):
    """
    Scheduling mode for posts
    """
    SINGLE_PLATFORM = "single_platform"
    MULTI_PLATFORM = "multi_platform"


class ContentLibraryType(str, Enum):
    """
    Content library item types
    """
    VIDEO_SCRIPT = "video_script"
    TEXT_POST = "text_post"
    THREAD = "thread"
    CAROUSEL = "carousel"
    STORY = "story"
    REEL = "reel"

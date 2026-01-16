"""
ⒸAngelaMos | 2025
enums.py
"""

from enum import Enum


class RemoteType(str, Enum):
    """
    Work location type for job postings
    """
    UNKNOWN = "unknown"
    ONSITE = "onsite"
    HYBRID = "hybrid"
    REMOTE = "remote"


class ApplicationStatus(str, Enum):
    """
    Current status of the job application itself
    """
    UNKNOWN = "unknown"
    SAVED = "saved"
    APPLIED = "applied"
    WITHDRAWN = "withdrawn"


class Outcome(str, Enum):
    """
    Final outcome of the job application
    """
    UNKNOWN = "unknown"
    PENDING = "pending"
    REJECTED = "rejected"
    OFFER = "offer"
    GHOSTED = "ghosted"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class JobType(str, Enum):
    """
    Employment type for the position
    """
    UNKNOWN = "unknown"
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class ExperienceLevel(str, Enum):
    """
    Required experience level for the position
    """
    UNKNOWN = "unknown"
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"
    EXECUTIVE = "executive"


class Priority(str, Enum):
    """
    How badly you want this job
    """
    UNKNOWN = "unknown"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    DREAM = "dream"

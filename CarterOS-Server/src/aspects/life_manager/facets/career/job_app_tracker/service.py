"""
ⒸAngelaMos | 2025
service.py
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ResourceNotFound, PermissionDenied
from aspects.life_manager.facets.career.job_app_tracker.repository import (
    JobApplicationRepository,
)
from aspects.life_manager.facets.career.job_app_tracker.schemas import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    JobApplicationListResponse,
)
from aspects.life_manager.facets.career.job_app_tracker.enums import (
    ApplicationStatus,
    Outcome,
)


class JobApplicationNotFound(ResourceNotFound):
    """
    Raised when job application not found
    """
    def __init__(self, application_id: UUID) -> None:
        super().__init__(resource="JobApplication", identifier=str(application_id))


class JobApplicationService:
    """
    Service for job application operations
    """

    @staticmethod
    async def get_application(
        session: AsyncSession,
        user_id: UUID,
        application_id: UUID,
    ) -> JobApplicationResponse:
        """
        Get a single job application by ID
        """
        application = await JobApplicationRepository.get_by_id(session, application_id)
        if not application:
            raise JobApplicationNotFound(application_id)
        if application.user_id != user_id:
            raise PermissionDenied()
        return JobApplicationResponse.model_validate(application)

    @staticmethod
    async def get_applications(
        session: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> JobApplicationListResponse:
        """
        Get all job applications for a user
        """
        applications = await JobApplicationRepository.get_by_user(
            session, user_id, skip, limit
        )
        total = await JobApplicationRepository.count_by_user(session, user_id)
        return JobApplicationListResponse(
            items=[JobApplicationResponse.model_validate(a) for a in applications],
            total=total,
        )

    @staticmethod
    async def get_by_status(
        session: AsyncSession,
        user_id: UUID,
        status: ApplicationStatus,
    ) -> JobApplicationListResponse:
        """
        Get job applications filtered by status
        """
        applications = await JobApplicationRepository.get_by_status(
            session, user_id, status
        )
        return JobApplicationListResponse(
            items=[JobApplicationResponse.model_validate(a) for a in applications],
            total=len(applications),
        )

    @staticmethod
    async def get_by_outcome(
        session: AsyncSession,
        user_id: UUID,
        outcome: Outcome,
    ) -> JobApplicationListResponse:
        """
        Get job applications filtered by outcome
        """
        applications = await JobApplicationRepository.get_by_outcome(
            session, user_id, outcome
        )
        return JobApplicationListResponse(
            items=[JobApplicationResponse.model_validate(a) for a in applications],
            total=len(applications),
        )

    @staticmethod
    async def get_pending_followups(
        session: AsyncSession,
        user_id: UUID,
    ) -> JobApplicationListResponse:
        """
        Get applications needing follow-up
        """
        applications = await JobApplicationRepository.get_pending_followups(
            session, user_id
        )
        return JobApplicationListResponse(
            items=[JobApplicationResponse.model_validate(a) for a in applications],
            total=len(applications),
        )

    @staticmethod
    async def create_application(
        session: AsyncSession,
        user_id: UUID,
        data: JobApplicationCreate,
    ) -> JobApplicationResponse:
        """
        Create a new job application
        """
        application = await JobApplicationRepository.create(
            session,
            user_id=user_id,
            **data.model_dump(),
        )
        return JobApplicationResponse.model_validate(application)

    @staticmethod
    async def update_application(
        session: AsyncSession,
        user_id: UUID,
        application_id: UUID,
        data: JobApplicationUpdate,
    ) -> JobApplicationResponse:
        """
        Update a job application
        """
        application = await JobApplicationRepository.get_by_id(session, application_id)
        if not application:
            raise JobApplicationNotFound(application_id)
        if application.user_id != user_id:
            raise PermissionDenied()

        update_dict = data.model_dump(exclude_unset=True)
        application = await JobApplicationRepository.update(
            session, application, **update_dict
        )
        return JobApplicationResponse.model_validate(application)

    @staticmethod
    async def delete_application(
        session: AsyncSession,
        user_id: UUID,
        application_id: UUID,
    ) -> None:
        """
        Delete a job application
        """
        application = await JobApplicationRepository.get_by_id(session, application_id)
        if not application:
            raise JobApplicationNotFound(application_id)
        if application.user_id != user_id:
            raise PermissionDenied()
        await JobApplicationRepository.delete(session, application)

    @staticmethod
    async def get_stats(
        session: AsyncSession,
        user_id: UUID,
    ) -> dict:
        """
        Get aggregated stats for job applications
        """
        return await JobApplicationRepository.get_stats(session, user_id)

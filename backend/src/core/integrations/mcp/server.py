"""
ⒸAngelaMos | 2025
server.py

CarterOS MCP Server - Exposes database and services to Claude via Telegram.
Provides both generic database access AND ergonomic service methods.
"""

from datetime import date
from uuid import UUID

from mcp.server.fastmcp import FastMCP
from sqlalchemy import text

from core.infrastructure.database.session import sessionmanager
from core.foundation.repositories.identity import IdentityRepository
from aspects.life_manager.facets.planner.service import PlannerService
from aspects.life_manager.facets.planner.schemas import (
    TimeBlockCreate,
    NoteCreate,
    NoteUpdate,
)
from aspects.life_manager.facets.career.job_app_tracker.service import (
    JobApplicationService,
)
from aspects.life_manager.facets.career.job_app_tracker.schemas import (
    JobApplicationCreate,
    JobApplicationUpdate,
)
from aspects.challenge.facets.tracker.service import ChallengeService
from aspects.challenge.facets.tracker.schemas import LogCreate

mcp = FastMCP(
    "carteros",
    description="CarterOS life management system - notes, planner, jobs, challenges",
)

CARTER_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


@mcp.tool()
async def execute_query(sql: str) -> list[dict]:
    """
    Execute read-only SQL query against CarterOS database.
    Use for SELECT queries to explore any data.
    Returns list of row dictionaries.
    """
    async with sessionmanager.session() as session:
        result = await session.execute(text(sql))
        rows = result.mappings().all()
        return [dict(row) for row in rows]


@mcp.tool()
async def list_tables() -> list[str]:
    """
    List all tables in the CarterOS database.
    """
    sql = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """
    async with sessionmanager.session() as session:
        result = await session.execute(text(sql))
        return [row[0] for row in result.fetchall()]


@mcp.tool()
async def describe_table(table_name: str) -> list[dict]:
    """
    Get schema for a table (column names, types, nullable).
    """
    sql = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = :table_name
        ORDER BY ordinal_position
    """
    async with sessionmanager.session() as session:
        result = await session.execute(text(sql), {"table_name": table_name})
        rows = result.fetchall()
        return [
            {
                "column": row[0],
                "type": row[1],
                "nullable": row[2] == "YES",
                "default": row[3],
            }
            for row in rows
        ]


@mcp.tool()
async def get_todays_schedule() -> list[dict]:
    """
    Get all time blocks scheduled for today.
    Returns list of {id, title, start_time, end_time, description, color}.
    """
    async with sessionmanager.session() as session:
        result = await PlannerService.get_blocks_by_date(session, date.today())
        return [item.model_dump(mode="json") for item in result.items]


@mcp.tool()
async def get_schedule_for_date(target_date: str) -> list[dict]:
    """
    Get time blocks for a specific date.
    Date format: YYYY-MM-DD
    """
    parsed_date = date.fromisoformat(target_date)
    async with sessionmanager.session() as session:
        result = await PlannerService.get_blocks_by_date(session, parsed_date)
        return [item.model_dump(mode="json") for item in result.items]


@mcp.tool()
async def create_time_block(
    title: str,
    start_time: str,
    end_time: str,
    block_date: str | None = None,
    description: str | None = None,
    color: str | None = None,
) -> dict:
    """
    Create a time block in the schedule.
    Times in HH:MM format (24h). Date defaults to today if not specified.
    """
    from datetime import time as dt_time

    parsed_date = date.fromisoformat(block_date) if block_date else date.today()
    start = dt_time.fromisoformat(start_time)
    end = dt_time.fromisoformat(end_time)

    data = TimeBlockCreate(
        block_date=parsed_date,
        start_time=start,
        end_time=end,
        title=title,
        description=description,
        color=color,
    )

    async with sessionmanager.session() as session:
        result = await PlannerService.create_block(session, data)
        return result.model_dump(mode="json")


@mcp.tool()
async def get_all_notes() -> dict:
    """
    Get all notes and folders.
    Returns {folders: [...], notes: [...]}.
    """
    async with sessionmanager.session() as session:
        result = await PlannerService.get_all_notes(session)
        return {
            "folders": [f.model_dump(mode="json") for f in result.folders],
            "notes": [n.model_dump(mode="json") for n in result.notes],
        }


@mcp.tool()
async def create_note(
    title: str,
    content: str = "",
    folder_id: str | None = None,
) -> dict:
    """
    Create a new note.
    Optionally specify folder_id to put it in a folder.
    """
    data = NoteCreate(
        title=title,
        content=content,
        folder_id=UUID(folder_id) if folder_id else None,
    )

    async with sessionmanager.session() as session:
        result = await PlannerService.create_note(session, data)
        return result.model_dump(mode="json")


@mcp.tool()
async def get_note(note_id: str) -> dict:
    """
    Get a single note by ID.
    """
    async with sessionmanager.session() as session:
        result = await PlannerService.get_note(session, UUID(note_id))
        return result.model_dump(mode="json")


@mcp.tool()
async def update_note(
    note_id: str,
    title: str | None = None,
    content: str | None = None,
    folder_id: str | None = None,
) -> dict:
    """
    Update an existing note. Only updates provided fields.
    """
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if content is not None:
        update_data["content"] = content
    if folder_id is not None:
        update_data["folder_id"] = UUID(folder_id)

    data = NoteUpdate(**update_data)

    async with sessionmanager.session() as session:
        result = await PlannerService.update_note(session, UUID(note_id), data)
        return result.model_dump(mode="json")


@mcp.tool()
async def search_notes(query: str) -> list[dict]:
    """
    Search notes by title and content (case-insensitive).
    """
    sql = """
        SELECT id, title, content, folder_id, created_at, updated_at
        FROM notes
        WHERE LOWER(title) LIKE LOWER(:query)
           OR LOWER(content) LIKE LOWER(:query)
        ORDER BY updated_at DESC
        LIMIT 50
    """
    async with sessionmanager.session() as session:
        result = await session.execute(text(sql), {"query": f"%{query}%"})
        rows = result.mappings().all()
        return [dict(row) for row in rows]


@mcp.tool()
async def get_job_applications(
    status: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """
    Get job applications. Optionally filter by status.
    Status options: applied, interviewing, offer, rejected, ghosted, withdrawn
    """
    async with sessionmanager.session() as session:
        if status:
            from aspects.life_manager.facets.career.job_app_tracker.enums import (
                ApplicationStatus,
            )

            result = await JobApplicationService.get_by_status(
                session, CARTER_USER_ID, ApplicationStatus(status)
            )
        else:
            result = await JobApplicationService.get_applications(
                session, CARTER_USER_ID, 0, limit
            )
        return [item.model_dump(mode="json") for item in result.items]


@mcp.tool()
async def get_pending_followups() -> list[dict]:
    """
    Get job applications that need follow-up action.
    """
    async with sessionmanager.session() as session:
        result = await JobApplicationService.get_pending_followups(
            session, CARTER_USER_ID
        )
        return [item.model_dump(mode="json") for item in result.items]


@mcp.tool()
async def create_job_application(
    company: str,
    position: str,
    url: str | None = None,
    notes: str | None = None,
) -> dict:
    """
    Track a new job application.
    """
    data = JobApplicationCreate(
        company=company,
        position=position,
        url=url,
        notes=notes,
    )

    async with sessionmanager.session() as session:
        result = await JobApplicationService.create_application(
            session, CARTER_USER_ID, data
        )
        return result.model_dump(mode="json")


@mcp.tool()
async def update_job_application(
    application_id: str,
    status: str | None = None,
    notes: str | None = None,
    outcome: str | None = None,
) -> dict:
    """
    Update a job application (status change, add notes, etc).
    """
    update_data = {}
    if status is not None:
        from aspects.life_manager.facets.career.job_app_tracker.enums import (
            ApplicationStatus,
        )

        update_data["status"] = ApplicationStatus(status)
    if notes is not None:
        update_data["notes"] = notes
    if outcome is not None:
        from aspects.life_manager.facets.career.job_app_tracker.enums import Outcome

        update_data["outcome"] = Outcome(outcome)

    data = JobApplicationUpdate(**update_data)

    async with sessionmanager.session() as session:
        result = await JobApplicationService.update_application(
            session, CARTER_USER_ID, UUID(application_id), data
        )
        return result.model_dump(mode="json")


@mcp.tool()
async def get_job_stats() -> dict:
    """
    Get aggregated job application statistics.
    Returns counts by status, response rates, etc.
    """
    async with sessionmanager.session() as session:
        return await JobApplicationService.get_stats(session, CARTER_USER_ID)


@mcp.tool()
async def get_challenge_status() -> dict:
    """
    Get current 30-day challenge with all stats and logs.
    Returns {name, start_date, end_date, current_day, total_content,
             total_jobs, content_goal, jobs_goal, logs: [...]}.
    """
    async with sessionmanager.session() as session:
        result = await ChallengeService.get_active_challenge(session)
        return result.model_dump(mode="json")


@mcp.tool()
async def log_content_today(
    tiktok: int = 0,
    instagram_reels: int = 0,
    youtube_shorts: int = 0,
    twitter: int = 0,
    reddit: int = 0,
    linkedin_personal: int = 0,
    linkedin_company: int = 0,
    youtube_full: int = 0,
    medium: int = 0,
    jobs_applied: int = 0,
) -> dict:
    """
    Log content created today. Updates existing log or creates new one.
    """
    data = LogCreate(
        log_date=date.today(),
        tiktok=tiktok,
        instagram_reels=instagram_reels,
        youtube_shorts=youtube_shorts,
        twitter=twitter,
        reddit=reddit,
        linkedin_personal=linkedin_personal,
        linkedin_company=linkedin_company,
        youtube_full=youtube_full,
        medium=medium,
        jobs_applied=jobs_applied,
    )

    async with sessionmanager.session() as session:
        result = await ChallengeService.create_or_update_log(session, data)
        return result.model_dump(mode="json")


@mcp.tool()
async def get_challenge_history() -> list[dict]:
    """
    Get past completed challenges.
    """
    async with sessionmanager.session() as session:
        result = await ChallengeService.get_history(session)
        return [item.model_dump(mode="json") for item in result.items]


@mcp.tool()
async def get_my_identity() -> dict:
    """
    Get Carter's full identity profile including:
    - Basic info (name, age, background, role, goals)
    - Skills with proficiency levels
    - Interests and passion levels
    - Strengths and weaknesses
    - Brand voice and content preferences
    - Platform goals

    Use this to understand context about Carter when helping.
    """
    async with sessionmanager.session() as session:
        identity = await IdentityRepository.get_identity(session)

        return {
            "name": identity.name,
            "age": identity.age,
            "background": identity.background,
            "current_role": identity.current_role,
            "primary_goal": identity.primary_goal,
            "target_audience": identity.target_audience,
            "skills": [
                {
                    "skill": s.skill,
                    "proficiency": s.proficiency.value,
                    "years_experience": s.years_experience,
                    "context": s.context,
                }
                for s in identity.skills
            ],
            "interests": [
                {
                    "topic": i.topic,
                    "passion_level": i.passion_level.value,
                    "why": i.why,
                }
                for i in identity.interests
            ],
            "strengths": [
                {
                    "strength": s.strength,
                    "source": s.source.value,
                    "evidence": s.evidence,
                }
                for s in identity.strengths
            ],
            "weaknesses": [
                {
                    "weakness": w.weakness,
                    "impact": w.impact,
                    "workaround": w.workaround,
                }
                for w in identity.weaknesses
            ],
            "brand_voice": {
                "tone": identity.brand_voice.tone if identity.brand_voice else None,
                "sentence_structure": (
                    identity.brand_voice.sentence_structure
                    if identity.brand_voice
                    else None
                ),
                "uses_analogies": (
                    identity.brand_voice.uses_analogies
                    if identity.brand_voice
                    else None
                ),
            }
            if identity.brand_voice
            else None,
            "platform_goals": [
                {
                    "platform": g.platform.value,
                    "current_followers": g.current_followers,
                    "goal_followers": g.goal_followers,
                    "strategy": g.strategy,
                }
                for g in identity.platform_goals
            ],
        }


@mcp.tool()
async def get_my_skills(proficiency: str | None = None) -> list[dict]:
    """
    Get Carter's skills. Optionally filter by proficiency level.
    Proficiency: beginner, intermediate, advanced, expert
    """
    async with sessionmanager.session() as session:
        if proficiency:
            from core.enums import ProficiencyLevel

            skills = await IdentityRepository.get_skills_by_proficiency(
                session, ProficiencyLevel(proficiency)
            )
        else:
            identity = await IdentityRepository.get_identity(session)
            skills = identity.skills

        return [
            {
                "skill": s.skill,
                "proficiency": s.proficiency.value,
                "years_experience": s.years_experience,
                "context": s.context,
            }
            for s in skills
        ]


@mcp.tool()
async def get_my_interests() -> list[dict]:
    """
    Get Carter's interests with passion levels.
    """
    async with sessionmanager.session() as session:
        interests = await IdentityRepository.get_passionate_interests(session)
        return [
            {
                "topic": i.topic,
                "passion_level": i.passion_level.value,
                "why": i.why,
            }
            for i in interests
        ]

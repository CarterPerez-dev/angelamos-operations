"""
ⒸAngelaMos | 2026
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
from aspects.life_manager.facets.planner.schemas import TimeBlockCreate
from aspects.life_manager.facets.notes.service import NotesService
from aspects.life_manager.facets.notes.schemas import (
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
from aspects.analytics.facets.data_input.service import DataInputService
from aspects.analytics.facets.data_input.schemas import (
    TikTokVideoCreate,
    TikTokVideoUpdate,
)
from aspects.analytics.facets.insights.service import InsightsService


mcp = FastMCP("carteros")

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
async def execute_write(sql: str) -> dict:
    """
    Execute write SQL (INSERT, UPDATE, DELETE) against CarterOS database.
    Use for modifying data. Returns affected row count.
    For INSERTs with RETURNING, also returns the inserted data.
    """
    async with sessionmanager.session() as session:
        result = await session.execute(text(sql))
        await session.commit()

        try:
            rows = result.mappings().all()
            return {
                "success": True,
                "rows_affected": result.rowcount,
                "returned_data": [dict(row) for row in rows],
            }
        except Exception:
            return {
                "success": True,
                "rows_affected": result.rowcount,
            }


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
        result = await session.execute(
            text(sql),
            {"table_name": table_name}
        )
        rows = result.fetchall()
        return [
            {
                "column": row[0],
                "type": row[1],
                "nullable": row[2] == "YES",
                "default": row[3],
            } for row in rows
        ]


@mcp.tool()
async def get_todays_schedule() -> list[dict]:
    """
    Get all time blocks scheduled for today.
    Returns list of {id, title, start_time, end_time, description, color}.
    """
    async with sessionmanager.session() as session:
        result = await PlannerService.get_blocks_by_date(
            session,
            date.today()
        )
        return [item.model_dump(mode = "json") for item in result.items]


@mcp.tool()
async def get_schedule_for_date(target_date: str) -> list[dict]:
    """
    Get time blocks for a specific date.
    Date format: YYYY-MM-DD
    """
    parsed_date = date.fromisoformat(target_date)
    async with sessionmanager.session() as session:
        result = await PlannerService.get_blocks_by_date(
            session,
            parsed_date
        )
        return [item.model_dump(mode = "json") for item in result.items]


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

    parsed_date = date.fromisoformat(block_date
                                     ) if block_date else date.today()
    start = dt_time.fromisoformat(start_time)
    end = dt_time.fromisoformat(end_time)

    data = TimeBlockCreate(
        block_date = parsed_date,
        start_time = start,
        end_time = end,
        title = title,
        description = description,
        color = color,
    )

    async with sessionmanager.session() as session:
        result = await PlannerService.create_block(session, data)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_all_notes() -> dict:
    """
    Get all notes and folders.
    Returns {folders: [...], notes: [...]}.
    """
    async with sessionmanager.session() as session:
        result = await NotesService.get_all_notes(session)
        return {
            "folders":
            [f.model_dump(mode = "json") for f in result.folders],
            "notes": [n.model_dump(mode = "json") for n in result.notes],
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
        title = title,
        content = content,
        folder_id = UUID(folder_id) if folder_id else None,
    )

    async with sessionmanager.session() as session:
        result = await NotesService.create_note(session, data)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_note(note_id: str) -> dict:
    """
    Get a single note by ID.
    """
    async with sessionmanager.session() as session:
        result = await NotesService.get_note(session, UUID(note_id))
        return result.model_dump(mode = "json")


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
        result = await NotesService.update_note(
            session,
            UUID(note_id),
            data
        )
        return result.model_dump(mode = "json")


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
                session,
                CARTER_USER_ID,
                ApplicationStatus(status)
            )
        else:
            result = await JobApplicationService.get_applications(
                session,
                CARTER_USER_ID,
                0,
                limit
            )
        return [item.model_dump(mode = "json") for item in result.items]


@mcp.tool()
async def get_pending_followups() -> list[dict]:
    """
    Get job applications that need follow-up action.
    """
    async with sessionmanager.session() as session:
        result = await JobApplicationService.get_pending_followups(
            session,
            CARTER_USER_ID
        )
        return [item.model_dump(mode = "json") for item in result.items]


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
        company = company,
        position = position,
        url = url,
        notes = notes,
    )

    async with sessionmanager.session() as session:
        result = await JobApplicationService.create_application(
            session,
            CARTER_USER_ID,
            data
        )
        return result.model_dump(mode = "json")


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
            session,
            CARTER_USER_ID,
            UUID(application_id),
            data
        )
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_job_stats() -> dict:
    """
    Get aggregated job application statistics.
    Returns counts by status, response rates, etc.
    """
    async with sessionmanager.session() as session:
        return await JobApplicationService.get_stats(
            session,
            CARTER_USER_ID
        )


@mcp.tool()
async def get_challenge_status() -> dict:
    """
    Get current 30-day challenge with all stats and logs.
    Returns {name, start_date, end_date, current_day, total_content,
             total_jobs, content_goal, jobs_goal, logs: [...]}.
    """
    async with sessionmanager.session() as session:
        result = await ChallengeService.get_active_challenge(session)
        return result.model_dump(mode = "json")


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
        log_date = date.today(),
        tiktok = tiktok,
        instagram_reels = instagram_reels,
        youtube_shorts = youtube_shorts,
        twitter = twitter,
        reddit = reddit,
        linkedin_personal = linkedin_personal,
        linkedin_company = linkedin_company,
        youtube_full = youtube_full,
        medium = medium,
        jobs_applied = jobs_applied,
    )

    async with sessionmanager.session() as session:
        result = await ChallengeService.create_or_update_log(session, data)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_challenge_history() -> list[dict]:
    """
    Get past completed challenges.
    """
    async with sessionmanager.session() as session:
        result = await ChallengeService.get_history(session)
        return [item.model_dump(mode = "json") for item in result.items]


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
            "name":
            identity.name,
            "age":
            identity.age,
            "background":
            identity.background,
            "current_role":
            identity.current_role,
            "primary_goal":
            identity.primary_goal,
            "target_audience":
            identity.target_audience,
            "skills": [
                {
                    "skill": s.skill,
                    "proficiency": s.proficiency.value,
                    "years_experience": s.years_experience,
                    "context": s.context,
                } for s in identity.skills
            ],
            "interests": [
                {
                    "topic": i.topic,
                    "passion_level": i.passion_level.value,
                    "why": i.why,
                } for i in identity.interests
            ],
            "strengths": [
                {
                    "strength": s.strength,
                    "source": s.source.value,
                    "evidence": s.evidence,
                } for s in identity.strengths
            ],
            "weaknesses": [
                {
                    "weakness": w.weakness,
                    "impact": w.impact,
                    "workaround": w.workaround,
                } for w in identity.weaknesses
            ],
            "brand_voice": {
                "tone":
                identity.brand_voice.tone
                if identity.brand_voice else None,
                "sentence_structure": (
                    identity.brand_voice.sentence_structure
                    if identity.brand_voice else None
                ),
                "uses_analogies": (
                    identity.brand_voice.uses_analogies
                    if identity.brand_voice else None
                ),
            } if identity.brand_voice else None,
            "platform_goals": [
                {
                    "platform": g.platform.value,
                    "current_followers": g.current_followers,
                    "goal_followers": g.goal_followers,
                    "strategy": g.strategy,
                } for g in identity.platform_goals
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
                session,
                ProficiencyLevel(proficiency)
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
            } for s in skills
        ]


@mcp.tool()
async def get_my_interests() -> list[dict]:
    """
    Get Carter's interests with passion levels.
    """
    async with sessionmanager.session() as session:
        interests = await IdentityRepository.get_passionate_interests(
            session
        )
        return [
            {
                "topic": i.topic,
                "passion_level": i.passion_level.value,
                "why": i.why,
            } for i in interests
        ]


@mcp.tool()
async def create_tiktok_video(
    rank: int,
    date_posted: str,
    hook: str,
    description: str,
    length: float,
    views: int,
    comments: int,
    likes: int,
    bookmarks: int,
    shares: int,
    avg_watch_time: float,
    new_followers: int,
    watched_full_video_percentage: float,
    video_url: str | None = None,
    text_on_screen_hook: str | None = None,
    hashtags: list[str] | None = None,
    cta: str | None = None,
    full_transcription: str | None = None,
    notes: str | None = None,
    top_comment_words: dict[str, int] | None = None,
    search_queries: dict[str, float] | None = None,
    traffic_sources: dict[str, float] | None = None,
) -> dict:
    """
    Create a new TikTok video record with performance metrics.
    Date format: YYYY-MM-DD. Length in seconds.
    avg_watch_time in seconds. watched_full_video_percentage 0-100.
    top_comment_words: {"word": count}. search_queries: {"query": percentage}.
    traffic_sources: {"source": percentage}.
    """
    data = TikTokVideoCreate(
        rank = rank,
        date_posted = date.fromisoformat(date_posted),
        video_url = video_url,
        views = views,
        comments = comments,
        likes = likes,
        bookmarks = bookmarks,
        shares = shares,
        avg_watch_time = avg_watch_time,
        new_followers = new_followers,
        watched_full_video_percentage = watched_full_video_percentage,
        top_comment_words = top_comment_words,
        search_queries = search_queries,
        traffic_sources = traffic_sources,
        hook = hook,
        text_on_screen_hook = text_on_screen_hook,
        length = length,
        description = description,
        hashtags = hashtags,
        cta = cta,
        full_transcription = full_transcription,
        notes = notes,
    )

    async with sessionmanager.session() as session:
        result = await DataInputService.create_video(session, data)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_tiktok_videos(
    page: int = 1,
    page_size: int = 50,
) -> dict:
    """
    Get all TikTok videos with pagination.
    Returns {items: [...], total, page, page_size}.
    """
    async with sessionmanager.session() as session:
        result = await DataInputService.get_all_videos(
            session,
            page,
            page_size
        )
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_tiktok_video(video_id: str) -> dict:
    """
    Get a single TikTok video by ID.
    """
    async with sessionmanager.session() as session:
        result = await DataInputService.get_video(
            session,
            UUID(video_id)
        )
        return result.model_dump(mode = "json")


@mcp.tool()
async def update_tiktok_video(
    video_id: str,
    rank: int | None = None,
    date_posted: str | None = None,
    video_url: str | None = None,
    views: int | None = None,
    comments: int | None = None,
    likes: int | None = None,
    bookmarks: int | None = None,
    shares: int | None = None,
    avg_watch_time: float | None = None,
    new_followers: int | None = None,
    watched_full_video_percentage: float | None = None,
    top_comment_words: dict[str, int] | None = None,
    search_queries: dict[str, float] | None = None,
    traffic_sources: dict[str, float] | None = None,
    hook: str | None = None,
    text_on_screen_hook: str | None = None,
    length: float | None = None,
    description: str | None = None,
    hashtags: list[str] | None = None,
    cta: str | None = None,
    full_transcription: str | None = None,
    notes: str | None = None,
) -> dict:
    """
    Update a TikTok video record. Only updates provided fields.
    Date format: YYYY-MM-DD.
    """
    update_data = {}
    if rank is not None:
        update_data["rank"] = rank
    if date_posted is not None:
        update_data["date_posted"] = date.fromisoformat(date_posted)
    if video_url is not None:
        update_data["video_url"] = video_url
    if views is not None:
        update_data["views"] = views
    if comments is not None:
        update_data["comments"] = comments
    if likes is not None:
        update_data["likes"] = likes
    if bookmarks is not None:
        update_data["bookmarks"] = bookmarks
    if shares is not None:
        update_data["shares"] = shares
    if avg_watch_time is not None:
        update_data["avg_watch_time"] = avg_watch_time
    if new_followers is not None:
        update_data["new_followers"] = new_followers
    if watched_full_video_percentage is not None:
        update_data["watched_full_video_percentage"] = (
            watched_full_video_percentage
        )
    if top_comment_words is not None:
        update_data["top_comment_words"] = top_comment_words
    if search_queries is not None:
        update_data["search_queries"] = search_queries
    if traffic_sources is not None:
        update_data["traffic_sources"] = traffic_sources
    if hook is not None:
        update_data["hook"] = hook
    if text_on_screen_hook is not None:
        update_data["text_on_screen_hook"] = text_on_screen_hook
    if length is not None:
        update_data["length"] = length
    if description is not None:
        update_data["description"] = description
    if hashtags is not None:
        update_data["hashtags"] = hashtags
    if cta is not None:
        update_data["cta"] = cta
    if full_transcription is not None:
        update_data["full_transcription"] = full_transcription
    if notes is not None:
        update_data["notes"] = notes

    data = TikTokVideoUpdate(**update_data)

    async with sessionmanager.session() as session:
        result = await DataInputService.update_video(
            session,
            UUID(video_id),
            data
        )
        return result.model_dump(mode = "json")


@mcp.tool()
async def delete_tiktok_video(video_id: str) -> dict:
    """
    Delete a TikTok video record by ID.
    """
    async with sessionmanager.session() as session:
        await DataInputService.delete_video(session, UUID(video_id))
        return {"success": True, "deleted_id": video_id}


@mcp.tool()
async def search_tiktok_videos(query: str) -> list[dict]:
    """
    Search TikTok videos by text across hook, description, hashtags,
    CTA, and transcription (case-insensitive).
    """
    async with sessionmanager.session() as session:
        results = await DataInputService.search_videos(session, query)
        return [r.model_dump(mode = "json") for r in results]


@mcp.tool()
async def filter_tiktok_videos_by_date_range(
    start_date: str,
    end_date: str,
) -> list[dict]:
    """
    Get TikTok videos within a date range.
    Date format: YYYY-MM-DD.
    """
    async with sessionmanager.session() as session:
        results = await DataInputService.get_videos_by_date_range(
            session,
            date.fromisoformat(start_date),
            date.fromisoformat(end_date)
        )
        return [r.model_dump(mode = "json") for r in results]


@mcp.tool()
async def get_analytics_overview() -> dict:
    """
    Get high-level TikTok analytics overview.
    Returns total videos, views, likes, comments, shares, bookmarks,
    new followers, avg engagement rate, avg watch time, top video,
    and recent performance trend (improving/declining/stable).
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_overview_insights(session)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_rankings(limit: int = 10) -> dict:
    """
    Get top performing TikTok videos ranked by different metrics.
    Returns four rankings: by_views, by_engagement_rate,
    by_follower_conversion, by_watch_time.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_performance_rankings(
            session,
            limit
        )
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_hooks(limit: int = 10) -> dict:
    """
    Get hook effectiveness analysis.
    Shows which hooks perform best by avg views, watch time,
    and engagement rate.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_hook_insights(session, limit)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_ctas(limit: int = 10) -> dict:
    """
    Get CTA (call-to-action) performance comparison.
    Shows which CTAs drive the most shares, new followers,
    and engagement.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_cta_insights(session, limit)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_traffic_sources() -> dict:
    """
    Get traffic source breakdown across all TikTok videos.
    Shows percentage distribution of where views come from
    (For You page, Following, Search, etc).
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_traffic_source_insights(session)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_search_queries(limit: int = 20) -> dict:
    """
    Get search query trends that led viewers to TikTok videos.
    Shows which search terms drive the most traffic.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_search_query_insights(
            session,
            limit
        )
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_comment_words(limit: int = 50) -> dict:
    """
    Get comment word frequency data (word cloud).
    Shows most common words appearing in video comments.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_comment_word_insights(
            session,
            limit
        )
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_video_length() -> dict:
    """
    Get performance breakdown by video length ranges.
    Shows which duration ranges (0:30-1:00, 1:00-1:30, etc)
    perform best by views, engagement, and watch percentage.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_video_length_insights(session)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_hashtags(limit: int = 20) -> dict:
    """
    Get hashtag performance analysis.
    Shows which hashtags drive the most views and engagement.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_hashtag_insights(session, limit)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_posting_time() -> dict:
    """
    Get optimal posting time analysis.
    Shows which days of the week perform best
    by views and engagement rate.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_posting_time_insights(session)
        return result.model_dump(mode = "json")


@mcp.tool()
async def get_analytics_time_series() -> dict:
    """
    Get TikTok performance trends over time.
    Returns data points with date, views, engagement rate,
    new followers, and video count per period.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.get_time_series_insights(session)
        return result.model_dump(mode = "json")


@mcp.tool()
async def export_analytics_data() -> dict:
    """
    Export all TikTok video data as JSON with calculated fields
    (engagement rate, follower conversion rate).
    Returns {videos: [...], total_count, export_date}.
    """
    async with sessionmanager.session() as session:
        result = await InsightsService.export_all_data(session)
        return result.model_dump(mode = "json")

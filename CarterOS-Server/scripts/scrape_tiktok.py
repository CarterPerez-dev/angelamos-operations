"""
ⒸAngelaMos | 2026
scrape_tiktok.py

Scrapes TikTok profile videos via direct HTTP requests and either:
  1. Saves to JSON for inspection
  2. Inserts directly into CarterOS database via DataInputService

Usage:
  uv run python scripts/scrape_tiktok.py --username YOUR_HANDLE --save
  uv run python scripts/scrape_tiktok.py --username YOUR_HANDLE --save --import-db
  uv run python scripts/scrape_tiktok.py --from-json scraped_videos.json --import-db

Requires ms_token from TikTok cookies (set as MS_TOKEN env var).
To get ms_token: open TikTok in browser, open DevTools > Application > Cookies,
find the 'msToken' cookie value and copy it.
"""

import argparse
import asyncio
import json
import re
import sys
import os
from datetime import date, datetime
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

TIKTOK_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.tiktok.com/",
}

ITEM_LIST_API = "https://www.tiktok.com/api/post/item_list/"


async def get_sec_uid(username: str, ms_token: str) -> str:
    """
    Get the secUid for a TikTok username by fetching the profile page.
    """
    url = f"https://www.tiktok.com/@{username}"
    cookies = {"msToken": ms_token}

    async with httpx.AsyncClient(
        headers=TIKTOK_HEADERS,
        cookies=cookies,
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()

        match = re.search(r'"secUid":"([^"]+)"', resp.text)
        if match:
            return match.group(1)

        match = re.search(
            r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>',
            resp.text,
            re.DOTALL,
        )
        if match:
            data = json.loads(match.group(1))
            default_scope = data.get("__DEFAULT_SCOPE__", {})
            user_detail = default_scope.get("webapp.user-detail", {})
            user_info = user_detail.get("userInfo", {})
            user = user_info.get("user", {})
            sec_uid = user.get("secUid", "")
            if sec_uid:
                return sec_uid

        raise ValueError(
            f"Could not find secUid for @{username}. "
            "The ms_token may be expired — grab a fresh one from your browser cookies."
        )


async def fetch_videos_page(
    client: httpx.AsyncClient,
    sec_uid: str,
    cursor: int,
    count: int = 35,
) -> dict:
    """
    Fetch one page of videos from TikTok's internal API.
    """
    params = {
        "aid": "1988",
        "app_language": "en",
        "app_name": "tiktok_web",
        "count": str(count),
        "cursor": str(cursor),
        "secUid": sec_uid,
        "WebIdLastTime": str(int(datetime.now().timestamp())),
    }

    resp = await client.get(ITEM_LIST_API, params=params)
    resp.raise_for_status()
    return resp.json()


async def scrape_profile(
    username: str,
    ms_token: str,
    max_count: int,
) -> list[dict]:
    """
    Scrape all videos from a TikTok user profile via direct API calls.
    """
    print(f"  Resolving secUid for @{username}...")
    sec_uid = await get_sec_uid(username, ms_token)
    print(f"  Got secUid: {sec_uid[:30]}...")

    videos = []
    cursor = 0
    has_more = True

    cookies = {"msToken": ms_token}

    async with httpx.AsyncClient(
        headers=TIKTOK_HEADERS,
        cookies=cookies,
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        while has_more and len(videos) < max_count:
            print(f"  Fetching page (cursor={cursor})...")
            data = await fetch_videos_page(client, sec_uid, cursor)

            item_list = data.get("itemList", [])
            if not item_list:
                break

            for raw in item_list:
                if len(videos) >= max_count:
                    break

                stats = raw.get("stats", {})
                video_meta = raw.get("video", {})
                challenges = raw.get("challenges", [])
                create_time = raw.get("createTime", 0)

                hashtags = [
                    f"#{c.get('title', '')}" for c in challenges
                    if c.get("title")
                ]

                desc = raw.get("desc", "")
                hook = desc.split("\n")[0].strip() if desc else ""
                if not hook:
                    hook = desc[:100].strip() if desc else "No description"

                posted_date = datetime.fromtimestamp(
                    int(create_time)
                ).strftime("%Y-%m-%d") if create_time else date.today().isoformat()

                video_id = raw.get("id", "")

                mapped = {
                    "tiktok_id": video_id,
                    "rank": len(videos) + 1,
                    "date_posted": posted_date,
                    "video_url": f"https://www.tiktok.com/@{username}/video/{video_id}",
                    "views": stats.get("playCount", 0),
                    "comments": stats.get("commentCount", 0),
                    "likes": stats.get("diggCount", 0),
                    "bookmarks": stats.get("collectCount", 0),
                    "shares": stats.get("shareCount", 0),
                    "avg_watch_time": 0.0,
                    "new_followers": 0,
                    "watched_full_video_percentage": 0.0,
                    "top_comment_words": None,
                    "search_queries": None,
                    "traffic_sources": None,
                    "hook": hook if hook else "No hook",
                    "text_on_screen_hook": None,
                    "length": float(video_meta.get("duration", 0)),
                    "description": desc if desc else "No description",
                    "hashtags": hashtags if hashtags else None,
                    "cta": None,
                    "full_transcription": None,
                    "notes": None,
                }

                videos.append(mapped)
                print(
                    f"  [{len(videos)}] {posted_date} | "
                    f"{stats.get('playCount', 0):>8} views | "
                    f"{hook[:60]}"
                )

            has_more = data.get("hasMore", False)
            cursor = data.get("cursor", cursor + 35)

            await asyncio.sleep(1.5)

    return videos


async def scrape_from_page_html(
    username: str,
    ms_token: str,
) -> list[dict]:
    """
    Fallback: extract videos from the embedded JSON in the profile page HTML.
    Gets fewer videos (only first page) but works when the API endpoint is blocked.
    """
    url = f"https://www.tiktok.com/@{username}"
    cookies = {"msToken": ms_token}

    async with httpx.AsyncClient(
        headers=TIKTOK_HEADERS,
        cookies=cookies,
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()

        match = re.search(
            r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>',
            resp.text,
            re.DOTALL,
        )
        if not match:
            match = re.search(
                r'<script id="SIGI_STATE"[^>]*>(.*?)</script>',
                resp.text,
                re.DOTALL,
            )

        if not match:
            raise ValueError("Could not find video data in profile page HTML")

        page_data = json.loads(match.group(1))

        default_scope = page_data.get("__DEFAULT_SCOPE__", page_data)
        user_post = default_scope.get("webapp.user-detail", {})

        item_module = page_data.get("ItemModule", {})
        if item_module:
            raw_videos = list(item_module.values())
        else:
            raw_videos = []

        videos = []
        for raw in raw_videos:
            stats = raw.get("stats", {})
            video_meta = raw.get("video", {})
            challenges = raw.get("challenges", [])
            create_time = raw.get("createTime", 0)

            hashtags = [
                f"#{c.get('title', '')}" for c in challenges
                if c.get("title")
            ]

            desc = raw.get("desc", "")
            hook = desc.split("\n")[0].strip() if desc else ""
            if not hook:
                hook = desc[:100].strip() if desc else "No description"

            posted_date = datetime.fromtimestamp(
                int(create_time)
            ).strftime("%Y-%m-%d") if create_time else date.today().isoformat()

            video_id = raw.get("id", "")

            mapped = {
                "tiktok_id": video_id,
                "rank": len(videos) + 1,
                "date_posted": posted_date,
                "video_url": f"https://www.tiktok.com/@{username}/video/{video_id}",
                "views": stats.get("playCount", 0),
                "comments": stats.get("commentCount", 0),
                "likes": stats.get("diggCount", 0),
                "bookmarks": stats.get("collectCount", 0),
                "shares": stats.get("shareCount", 0),
                "avg_watch_time": 0.0,
                "new_followers": 0,
                "watched_full_video_percentage": 0.0,
                "top_comment_words": None,
                "search_queries": None,
                "traffic_sources": None,
                "hook": hook if hook else "No hook",
                "text_on_screen_hook": None,
                "length": float(video_meta.get("duration", 0)),
                "description": desc if desc else "No description",
                "hashtags": hashtags if hashtags else None,
                "cta": None,
                "full_transcription": None,
                "notes": None,
            }

            videos.append(mapped)
            print(
                f"  [{len(videos)}] {posted_date} | "
                f"{stats.get('playCount', 0):>8} views | "
                f"{hook[:60]}"
            )

        return videos


async def import_to_db(videos: list[dict]) -> None:
    """
    Insert scraped videos into CarterOS database via DataInputService.
    """
    os.environ.setdefault(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:yoshi2003@localhost:4420/app_db"
    )

    from core.infrastructure.database.session import sessionmanager
    from aspects.analytics.facets.data_input.service import DataInputService
    from aspects.analytics.facets.data_input.schemas import TikTokVideoCreate

    sessionmanager.init(os.environ["DATABASE_URL"])

    success = 0
    failed = 0

    async with sessionmanager.session() as session:
        for i, v in enumerate(videos, 1):
            try:
                data = TikTokVideoCreate(
                    rank=v["rank"],
                    date_posted=date.fromisoformat(v["date_posted"]),
                    video_url=v.get("video_url"),
                    views=v["views"],
                    comments=v["comments"],
                    likes=v["likes"],
                    bookmarks=v["bookmarks"],
                    shares=v["shares"],
                    avg_watch_time=v.get("avg_watch_time", 0.0),
                    new_followers=v.get("new_followers", 0),
                    watched_full_video_percentage=v.get(
                        "watched_full_video_percentage", 0.0
                    ),
                    top_comment_words=v.get("top_comment_words"),
                    search_queries=v.get("search_queries"),
                    traffic_sources=v.get("traffic_sources"),
                    hook=v["hook"],
                    text_on_screen_hook=v.get("text_on_screen_hook"),
                    length=v["length"] if v["length"] > 0 else 1.0,
                    description=v["description"],
                    hashtags=v.get("hashtags"),
                    cta=v.get("cta"),
                    full_transcription=v.get("full_transcription"),
                    notes=v.get("notes"),
                )
                await DataInputService.create_video(session, data)
                success += 1
                print(f"  [{i}/{len(videos)}] Inserted: {v['hook'][:50]}")
            except Exception as e:
                failed += 1
                print(f"  [{i}/{len(videos)}] FAILED: {v['hook'][:50]} -> {e}")

    await sessionmanager.close()
    print(f"\nDone: {success} inserted, {failed} failed out of {len(videos)} total")


def save_to_json(videos: list[dict], filename: str) -> None:
    """
    Save scraped video data to JSON file.
    """
    with open(filename, "w") as f:
        json.dump(videos, f, indent=2, default=str)
    print(f"\nSaved {len(videos)} videos to {filename}")


def load_from_json(filename: str) -> list[dict]:
    """
    Load previously scraped video data from JSON.
    """
    with open(filename) as f:
        return json.load(f)


def main() -> None:
    """
    CLI entry point.
    """
    parser = argparse.ArgumentParser(
        description="Scrape TikTok profile videos and import to CarterOS"
    )
    parser.add_argument(
        "--username", "-u",
        help="TikTok username to scrape (without @)"
    )
    parser.add_argument(
        "--count", "-c",
        type=int,
        default=200,
        help="Max number of videos to scrape (default: 200)"
    )
    parser.add_argument(
        "--save", "-s",
        action="store_true",
        help="Save scraped data to JSON file"
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="Output JSON filename (default: scraped_{username}.json)"
    )
    parser.add_argument(
        "--import-db",
        action="store_true",
        help="Import scraped data into CarterOS database"
    )
    parser.add_argument(
        "--from-json", "-f",
        help="Load from existing JSON file instead of scraping"
    )
    parser.add_argument(
        "--fallback",
        action="store_true",
        help="Use HTML page scraping fallback (fewer videos but more reliable)"
    )

    args = parser.parse_args()

    if not args.from_json and not args.username:
        parser.error("Either --username or --from-json is required")

    if args.from_json:
        print(f"Loading from {args.from_json}...")
        videos = load_from_json(args.from_json)
        print(f"Loaded {len(videos)} videos")
    else:
        ms_token = os.environ.get("MS_TOKEN")
        if not ms_token:
            print("ERROR: Set MS_TOKEN env var with your TikTok msToken cookie value")
            print("  How: Open TikTok in browser > DevTools > Application > Cookies > msToken")
            print("  Then: export MS_TOKEN='your_token_here'")
            sys.exit(1)

        print(f"Scraping @{args.username} (up to {args.count} videos)...\n")

        if args.fallback:
            videos = asyncio.run(
                scrape_from_page_html(args.username, ms_token)
            )
        else:
            try:
                videos = asyncio.run(
                    scrape_profile(args.username, ms_token, args.count)
                )
            except Exception as e:
                print(f"\nAPI scrape failed: {e}")
                print("Trying HTML fallback...\n")
                videos = asyncio.run(
                    scrape_from_page_html(args.username, ms_token)
                )

        print(f"\nScraped {len(videos)} videos")

    if args.save or not args.import_db:
        output = args.output or f"scraped_{args.username or 'videos'}.json"
        save_to_json(videos, output)

    if args.import_db:
        print("\nImporting to database...")
        asyncio.run(import_to_db(videos))


if __name__ == "__main__":
    main()

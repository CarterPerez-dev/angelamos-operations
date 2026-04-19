// ⒸAngelaMos | 2026
// tiktok_console_scraper.js
//
// Paste into DevTools Console on your TikTok profile page.
// Intercepts TikTok's own API responses as you scroll to get full video stats.
//
// Steps:
//   1. Go to https://www.tiktok.com/@certgames.com
//   2. Open DevTools (F12) > Console tab
//   3. Paste this entire script and press Enter
//   4. Wait for auto-scroll to finish (logs progress)
//   5. JSON file auto-downloads when done
//   6. Import: uv run python scripts/scrape_tiktok.py --from-json scraped_tiktok_videos.json --import-db

(async () => {
  const SCROLL_DELAY = 2000;
  const MAX_SCROLLS = 300;
  const collectedVideos = new Map();

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    if (url.includes("/api/post/item_list") || url.includes("item_list")) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        const items = data.itemList || [];
        items.forEach(item => {
          if (!collectedVideos.has(item.id)) {
            collectedVideos.set(item.id, item);
          }
        });
        console.log(`Intercepted ${items.length} videos (total: ${collectedVideos.size})`);
      } catch (e) {}
    }
    return response;
  };

  console.log("Fetch interceptor active. Starting auto-scroll...");

  let previousHeight = 0;
  let noChangeCount = 0;

  for (let i = 0; i < MAX_SCROLLS; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, SCROLL_DELAY));

    const currentHeight = document.body.scrollHeight;
    if (currentHeight === previousHeight) {
      noChangeCount++;
      if (noChangeCount >= 6) {
        console.log("No more content to load. Stopping.");
        break;
      }
    } else {
      noChangeCount = 0;
    }
    previousHeight = currentHeight;
    console.log(`Scroll ${i + 1}: ${collectedVideos.size} videos captured`);
  }

  window.fetch = originalFetch;

  console.log(`\nProcessing ${collectedVideos.size} videos...`);

  const videos = [];
  let rank = 0;

  for (const [id, raw] of collectedVideos) {
    rank++;
    const stats = raw.stats || {};
    const videoMeta = raw.video || {};
    const challenges = raw.challenges || [];
    const createTime = raw.createTime || 0;
    const desc = raw.desc || "";
    const author = raw.author || {};

    const hashtags = challenges
      .map(c => `#${c.title}`)
      .filter(h => h.length > 1);

    const descHashtags = (desc.match(/#[\w\u00C0-\u024F]+/g) || []);
    const allHashtags = [...new Set([...hashtags, ...descHashtags])];

    let hook = desc.split("\n")[0].trim();
    if (!hook) hook = desc.substring(0, 100).trim();
    if (!hook) hook = "No description";

    const datePosted = createTime
      ? new Date(createTime * 1000).toISOString().split("T")[0]
      : null;

    const username = author.uniqueId || window.location.pathname.replace("/@", "");

    videos.push({
      tiktok_id: id,
      rank: rank,
      date_posted: datePosted,
      video_url: `https://www.tiktok.com/@${username}/video/${id}`,
      views: stats.playCount || 0,
      comments: stats.commentCount || 0,
      likes: stats.diggCount || 0,
      bookmarks: stats.collectCount || 0,
      shares: stats.shareCount || 0,
      avg_watch_time: 0.0,
      new_followers: 0,
      watched_full_video_percentage: 0.0,
      top_comment_words: null,
      search_queries: null,
      traffic_sources: null,
      hook: hook,
      text_on_screen_hook: null,
      length: videoMeta.duration || 0,
      description: desc || "No description",
      hashtags: allHashtags.length > 0 ? allHashtags : null,
      cta: null,
      full_transcription: null,
      notes: null,
    });
  }

  videos.sort((a, b) => (b.date_posted || "").localeCompare(a.date_posted || ""));
  videos.forEach((v, i) => v.rank = i + 1);

  console.log(`\nDone! ${videos.length} videos with full stats.`);
  console.log("Sample:", JSON.stringify(videos[0], null, 2));

  const blob = new Blob([JSON.stringify(videos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scraped_tiktok_videos.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log("\nJSON downloaded! Import with:");
  console.log("  uv run python scripts/scrape_tiktok.py --from-json scraped_tiktok_videos.json --import-db");
})();

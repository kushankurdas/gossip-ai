import dotenv from "dotenv";
import { AppConfig } from "./types";

dotenv.config();

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export function loadConfig(): AppConfig {
  // Parse DIGEST_HOURS="8,18" → [8, 18]. Empty = notify every cycle.
  const digestHoursRaw = optionalEnv("DIGEST_HOURS", "");
  const digestHours = digestHoursRaw
    ? digestHoursRaw.split(",").map((h) => parseInt(h.trim(), 10)).filter((h) => !isNaN(h))
    : [];

  // Parse BLOCKLIST_KEYWORDS → lowercase string array
  const blocklistRaw = optionalEnv(
    "BLOCKLIST_KEYWORDS",
    "sponsored,deals,best buy,review roundup,giveaway,discount,coupon"
  );
  const blocklistKeywords = blocklistRaw
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  return {
    pollIntervalMinutes: parseInt(optionalEnv("POLL_INTERVAL_MINUTES", "15"), 10),
    maxAgeHours: parseInt(optionalEnv("SOURCE_MAX_AGE_HOURS", "24"), 10),
    digestHours,
    blocklistKeywords,
    fetchFullArticles: optionalEnv("FETCH_FULL_ARTICLES", "false") === "true",
    filterPaywalledArticles: optionalEnv("FILTER_PAYWALLED_ARTICLES", "false") === "true",
    seenMaxAgeDays: parseInt(optionalEnv("SEEN_MAX_AGE_DAYS", "14"), 10),

    sources: [
      {
        name: "Hacker News",
        type: "rss",
        url: "https://news.ycombinator.com/rss",
        enabled: optionalEnv("SOURCE_HN_ENABLED", "true") === "true",
      },
      {
        name: "Reddit r/programming",
        type: "reddit",
        url: "https://www.reddit.com/r/programming",
        enabled: optionalEnv("SOURCE_REDDIT_PROGRAMMING_ENABLED", "true") === "true",
      },
      {
        name: "Reddit r/webdev",
        type: "reddit",
        url: "https://www.reddit.com/r/webdev",
        enabled: optionalEnv("SOURCE_REDDIT_WEBDEV_ENABLED", "true") === "true",
      },
      {
        name: "Reddit r/javascript",
        type: "reddit",
        url: "https://www.reddit.com/r/javascript",
        enabled: optionalEnv("SOURCE_REDDIT_JS_ENABLED", "true") === "true",
      },
      {
        name: "daily.dev",
        type: "scrape",
        url: "https://api.daily.dev/graphql",
        enabled: optionalEnv("SOURCE_DAILYDEV_ENABLED", "true") === "true",
      },
      {
        name: "Dev.to",
        type: "rss",
        url: "https://dev.to/feed",
        enabled: optionalEnv("SOURCE_DEVTO_ENABLED", "false") === "true",
      },
      {
        name: "IEEE Spectrum",
        type: "rss",
        url: "https://spectrum.ieee.org/rss/fulltext",
        enabled: optionalEnv("SOURCE_IEEE_ENABLED", "true") === "true",
      },
      {
        name: "AWS What's New",
        type: "rss",
        url: "https://aws.amazon.com/new/feed/",
        enabled: optionalEnv("SOURCE_AWS_ENABLED", "true") === "true",
      },
      {
        name: "Techmeme",
        type: "rss",
        url: "https://www.techmeme.com/feed.xml",
        enabled: optionalEnv("SOURCE_TECHMEME_ENABLED", "true") === "true",
      },
      {
        name: "TechCrunch",
        type: "rss",
        url: "https://techcrunch.com/feed/",
        enabled: optionalEnv("SOURCE_TECHCRUNCH_ENABLED", "true") === "true",
      },
      {
        name: "Wired",
        type: "rss",
        url: "https://www.wired.com/feed/rss",
        enabled: optionalEnv("SOURCE_WIRED_ENABLED", "true") === "true",
      },
      {
        name: "Engadget",
        type: "rss",
        url: "https://www.engadget.com/rss.xml",
        enabled: optionalEnv("SOURCE_ENGADGET_ENABLED", "true") === "true",
      },
      {
        name: "InfoQ",
        type: "rss",
        url: "https://www.infoq.com/feed/",
        enabled: optionalEnv("SOURCE_INFOQ_ENABLED", "true") === "true",
      },
      {
        name: "TLDR Tech",
        type: "rss",
        url: "https://tldr.tech/api/rss/tech",
        enabled: optionalEnv("SOURCE_TLDR_ENABLED", "true") === "true",
      },

      // ── Security & Cybersecurity ────────────────────────────────
      {
        name: "Krebs on Security",
        type: "rss",
        url: "https://krebsonsecurity.com/feed/",
        enabled: optionalEnv("SOURCE_KREBS_ENABLED", "true") === "true",
      },
      {
        name: "BleepingComputer",
        type: "rss",
        url: "https://www.bleepingcomputer.com/feed/",
        enabled: optionalEnv("SOURCE_BLEEPING_ENABLED", "true") === "true",
      },
      {
        name: "Schneier on Security",
        type: "rss",
        url: "https://www.schneier.com/feed/atom/",
        enabled: optionalEnv("SOURCE_SCHNEIER_ENABLED", "true") === "true",
      },
      {
        name: "The Hacker News",
        type: "rss",
        url: "https://feeds.feedburner.com/TheHackersNews",
        enabled: optionalEnv("SOURCE_THN_ENABLED", "true") === "true",
      },
      {
        name: "Dark Reading",
        type: "rss",
        url: "https://www.darkreading.com/rss.xml",
        enabled: optionalEnv("SOURCE_DARKREADING_ENABLED", "true") === "true",
      },
      {
        name: "SecurityWeek",
        type: "rss",
        url: "https://feeds.feedburner.com/Securityweek",
        enabled: optionalEnv("SOURCE_SECWEEK_ENABLED", "false") === "true",
      },
      {
        name: "The Register — Security",
        type: "rss",
        url: "https://www.theregister.com/security/headlines.atom",
        enabled: optionalEnv("SOURCE_REG_SEC_ENABLED", "true") === "true",
      },
      {
        name: "CISA Advisories",
        type: "rss",
        url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
        enabled: optionalEnv("SOURCE_CISA_ENABLED", "true") === "true",
      },
      {
        name: "Google Project Zero",
        type: "rss",
        url: "https://googleprojectzero.blogspot.com/feeds/posts/default",
        enabled: optionalEnv("SOURCE_PROJECTZERO_ENABLED", "true") === "true",
      },
      {
        name: "SANS ISC Diary",
        type: "rss",
        url: "https://isc.sans.edu/rssfeed_full.xml",
        enabled: optionalEnv("SOURCE_SANS_ENABLED", "true") === "true",
      },
      {
        name: "Microsoft MSRC Blog",
        type: "rss",
        url: "https://msrc.microsoft.com/blog/feed/",
        enabled: optionalEnv("SOURCE_MSRC_ENABLED", "true") === "true",
      },
      {
        name: "GitHub Security Advisories",
        type: "rss",
        url: "https://github.com/advisories.atom",
        enabled: optionalEnv("SOURCE_GHSA_ENABLED", "true") === "true",
      },
      {
        name: "PortSwigger Research",
        type: "rss",
        url: "https://portswigger.net/research/rss",
        enabled: optionalEnv("SOURCE_PORTSWIGGER_ENABLED", "true") === "true",
      },
      {
        name: "Reddit r/netsec",
        type: "reddit",
        url: "https://www.reddit.com/r/netsec",
        enabled: optionalEnv("SOURCE_REDDIT_NETSEC_ENABLED", "true") === "true",
      },
      {
        name: "Reddit r/cybersecurity",
        type: "reddit",
        url: "https://www.reddit.com/r/cybersecurity",
        enabled: optionalEnv("SOURCE_REDDIT_CYBERSEC_ENABLED", "false") === "true",
      },
      {
        name: "Reddit r/blueteamsec",
        type: "reddit",
        url: "https://www.reddit.com/r/blueteamsec",
        enabled: optionalEnv("SOURCE_REDDIT_BLUETEAM_ENABLED", "false") === "true",
      },

      // ── Long-tail / below-headlines ────────────────────────────
      {
        name: "Lobsters",
        type: "rss",
        url: "https://lobste.rs/rss",
        enabled: optionalEnv("SOURCE_LOBSTERS_ENABLED", "true") === "true",
      },
      {
        // Unofficial third-party RSS proxy for github.com/trending. No SLA.
        name: "GitHub Trending (daily)",
        type: "rss",
        url: "https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml",
        enabled: optionalEnv("SOURCE_GH_TRENDING_ENABLED", "true") === "true",
      },
      {
        name: "Medium — programming tag",
        type: "rss",
        url: "https://medium.com/feed/tag/programming",
        enabled: optionalEnv("SOURCE_MEDIUM_PROG_ENABLED", "false") === "true",
      },
      {
        name: "Medium — cybersecurity tag",
        type: "rss",
        url: "https://medium.com/feed/tag/cybersecurity",
        enabled: optionalEnv("SOURCE_MEDIUM_SEC_ENABLED", "false") === "true",
      },

      // ── Substack / curated newsletters ──────────────────────────
      {
        name: "Stratechery (Ben Thompson)",
        type: "rss",
        url: "https://stratechery.com/feed/",
        enabled: optionalEnv("SOURCE_STRATECHERY_ENABLED", "false") === "true",
      },
      {
        name: "Platformer (Casey Newton)",
        type: "rss",
        url: "https://www.platformer.news/feed",
        enabled: optionalEnv("SOURCE_PLATFORMER_ENABLED", "false") === "true",
      },
      {
        name: "Risky Business News",
        type: "rss",
        url: "https://news.risky.biz/feed/",
        enabled: optionalEnv("SOURCE_RISKYBIZ_ENABLED", "true") === "true",
      },
      {
        name: "tl;dr sec (Clint Gibler)",
        type: "rss",
        url: "https://tldrsec.com/feed.xml",
        enabled: optionalEnv("SOURCE_TLDRSEC_ENABLED", "true") === "true",
      },
      {
        name: "Last Week in AWS (Corey Quinn)",
        type: "rss",
        url: "https://www.lastweekinaws.com/feed/",
        enabled: optionalEnv("SOURCE_LWIA_ENABLED", "false") === "true",
      },

      // ── Social (Bluesky / Mastodon) — uncomment and fill in handles ──
      // Bluesky per-account RSS: https://bsky.app/profile/<handle>.bsky.social/rss
      // Mastodon per-account RSS: https://<instance>/@<user>.rss
      // {
      //   name: "Bluesky — <handle>",
      //   type: "rss",
      //   url: "https://bsky.app/profile/<handle>.bsky.social/rss",
      //   enabled: optionalEnv("SOURCE_BSKY_EXAMPLE_ENABLED", "true") === "true",
      // },
      // {
      //   name: "Mastodon — @<user>@infosec.exchange",
      //   type: "rss",
      //   url: "https://infosec.exchange/@<user>.rss",
      //   enabled: optionalEnv("SOURCE_MASTO_EXAMPLE_ENABLED", "true") === "true",
      // },

      // ── Competitor monitoring — fill in your list ──
      // Three patterns covering ~all blogs:
      //
      //   A) Has RSS (WordPress, Ghost, Substack, Hashnode, most CMS):
      //      Find feed via:  curl -sL <blog-url> | grep -i 'rel=.alternate.*rss'
      //      type: "rss", url: "https://<host>/feed/" (or /rss, /atom.xml)
      //
      //   B) No RSS but has sitemap.xml (Webflow, Framer, Next.js, custom):
      //      type: "sitemap", url: "https://<host>/sitemap.xml"
      //      urlPattern: regex to keep only post URLs, e.g. "/post/" or "/blog/"
      //      maxItemsPerCycle: cap (default 30) — first run else fetches every recent post
      //
      //   C) GitHub releases for any public repo (free atom feed, no auth):
      //      type: "rss", url: "https://github.com/<owner>/<repo>/releases.atom"
      //
      // Live examples (uncomment and tweak):
      //
      // {
      //   name: "Sprinto — Blog",                          // pattern A: WordPress
      //   type: "rss",
      //   url: "https://sprinto.com/feed/",
      //   enabled: optionalEnv("SOURCE_COMP_SPRINTO_ENABLED", "true") === "true",
      // },
      // {
      //   name: "Scrut — Blog",                            // pattern B: Webflow, no RSS
      //   type: "sitemap",
      //   url: "https://www.scrut.io/sitemap.xml",
      //   urlPattern: "/post/",
      //   maxItemsPerCycle: 30,
      //   enabled: optionalEnv("SOURCE_COMP_SCRUT_ENABLED", "true") === "true",
      // },
      // {
      //   name: "Vanta — GitHub Releases",                 // pattern C: any public repo
      //   type: "rss",
      //   url: "https://github.com/vantatech/vanta/releases.atom",
      //   enabled: optionalEnv("SOURCE_COMP_VANTA_GH_ENABLED", "true") === "true",
      // },
    ],

    notifiers: {
      email: {
        enabled: optionalEnv("EMAIL_ENABLED", "false") === "true",
        smtp: {
          host: optionalEnv("SMTP_HOST", "smtp.gmail.com"),
          port: parseInt(optionalEnv("SMTP_PORT", "587"), 10),
          secure: optionalEnv("SMTP_SECURE", "false") === "true",
          user: optionalEnv("SMTP_USER"),
          pass: optionalEnv("SMTP_PASS"),
        },
        from: optionalEnv("EMAIL_FROM", optionalEnv("SMTP_USER")),
        to: optionalEnv("EMAIL_TO", "")
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
      },
      slack: {
        enabled: optionalEnv("SLACK_ENABLED", "false") === "true",
        webhookUrl: optionalEnv("SLACK_WEBHOOK_URL"),
        botToken: optionalEnv("SLACK_BOT_TOKEN") || undefined,
        channelId: optionalEnv("SLACK_CHANNEL_ID") || undefined,
        useThreads: optionalEnv("SLACK_USE_THREADS", "false") === "true",
      },
    },

    ai: (() => {
      const openaiBaseUrl = optionalEnv("OPENAI_BASE_URL").trim().replace(/\/$/, "");
      const openaiApiKeyRaw = optionalEnv("OPENAI_API_KEY").trim();
      const anthropicApiKey = optionalEnv("ANTHROPIC_API_KEY").trim();
      const enabled = !!(openaiApiKeyRaw || openaiBaseUrl || anthropicApiKey);
      const openaiApiKey = openaiApiKeyRaw || (openaiBaseUrl ? "ollama" : "");
      return {
        enabled,
        openaiApiKeyRaw,
        openaiApiKey,
        openaiBaseUrl,
        model: optionalEnv("OPENAI_MODEL", "gpt-4o-mini"),
        anthropicApiKey,
        anthropicModel: optionalEnv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
        topicFilter: optionalEnv(
          "AI_TOPIC_FILTER",
          "software engineering, AI/ML, cloud infrastructure, developer tools, cybersecurity, open source"
        ),
        userContext: optionalEnv("AI_USER_CONTEXT", ""),
        relevanceThreshold: parseInt(optionalEnv("AI_RELEVANCE_THRESHOLD", "5"), 10),
        minGroupSize: parseInt(optionalEnv("AI_MIN_GROUP_SIZE", "2"), 10),
      };
    })(),
  };
}

import axios from "axios";
import * as cheerio from "cheerio";
import { Article, SourceConfig } from "../types";
import { hashUrl } from "../utils/hash";
import { logger } from "../utils/logger";
import { recordSuccess, recordFailure } from "../utils/sourceHealth";
import { hasBeenSeen } from "../utils/seenStore";

const SITEMAP_BACKSTOP_DAYS = 14;
const DEFAULT_MAX_ITEMS = 30;
const FETCH_CONCURRENCY = 5;
const PAGE_TIMEOUT_MS = 8000;
const SITEMAP_TIMEOUT_MS = 10000;

interface SitemapEntry {
  loc: string;
  lastmod?: Date;
}

export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const urlRe = /<url>([\s\S]*?)<\/url>/g;
  let match: RegExpExecArray | null;
  while ((match = urlRe.exec(xml)) !== null) {
    const block = match[1];
    const locRaw = /<loc>([\s\S]*?)<\/loc>/.exec(block)?.[1]?.trim();
    if (!locRaw) continue;
    const loc = locRaw
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    const lastmodStr = /<lastmod>([\s\S]*?)<\/lastmod>/.exec(block)?.[1]?.trim();
    let lastmod: Date | undefined;
    if (lastmodStr) {
      const d = new Date(lastmodStr);
      if (!isNaN(d.getTime())) lastmod = d;
    }
    entries.push({ loc, lastmod });
  }
  return entries;
}

async function fetchPage(
  url: string,
  sourceName: string,
  fallbackDate?: Date
): Promise<Article | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GossipAI/1.0; +https://github.com/kushankurdas/tech-news-notifier)",
        Accept: "text/html",
      },
      timeout: PAGE_TIMEOUT_MS,
      maxRedirects: 3,
      maxContentLength: 512 * 1024,
    });

    const $ = cheerio.load(response.data as string);
    const title = (
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").first().text() ||
      ""
    ).trim();
    if (!title) return null;

    const excerpt = (
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      ""
    ).trim();

    const pubStr =
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[name="article:published_time"]').attr("content") ||
      $('meta[property="og:updated_time"]').attr("content") ||
      $("time[datetime]").first().attr("datetime");
    let publishedAt: Date | undefined;
    if (pubStr) {
      const d = new Date(pubStr);
      if (!isNaN(d.getTime())) publishedAt = d;
    }

    return {
      id: hashUrl(url),
      title,
      url,
      source: sourceName,
      publishedAt: publishedAt ?? fallbackDate ?? new Date(),
      excerpt: excerpt.length > 300 ? excerpt.slice(0, 297) + "..." : excerpt,
    };
  } catch {
    return null;
  }
}

export async function fetchSitemap(source: SourceConfig): Promise<Article[]> {
  try {
    logger.info(`Fetching sitemap: ${source.name} (${source.url})`);

    const response = await axios.get(source.url, {
      headers: { "User-Agent": "GossipAI/1.0 (Sitemap Reader)" },
      timeout: SITEMAP_TIMEOUT_MS,
      maxContentLength: 5 * 1024 * 1024,
    });

    const allEntries = parseSitemap(response.data as string);
    const pattern = source.urlPattern ? new RegExp(source.urlPattern) : null;
    const cutoff = new Date(Date.now() - SITEMAP_BACKSTOP_DAYS * 24 * 60 * 60 * 1000);
    const cap = source.maxItemsPerCycle ?? DEFAULT_MAX_ITEMS;

    // Pre-filter against seenStore so already-fetched URLs are not re-scraped each cycle.
    // Many sitemaps (e.g. Webflow) have no <lastmod>, so every cycle would otherwise refetch
    // the same N most-recent posts indefinitely.
    const candidates = allEntries
      .filter((e) => !pattern || pattern.test(e.loc))
      .filter((e) => !e.lastmod || e.lastmod >= cutoff)
      .filter((e) => !hasBeenSeen(hashUrl(e.loc)))
      .sort((a, b) => (b.lastmod?.getTime() ?? 0) - (a.lastmod?.getTime() ?? 0))
      .slice(0, cap);

    logger.info(
      `  -> ${allEntries.length} sitemap entries, ${candidates.length} unseen after filters, fetching pages...`
    );

    const articles: Article[] = [];
    for (let i = 0; i < candidates.length; i += FETCH_CONCURRENCY) {
      const batch = candidates.slice(i, i + FETCH_CONCURRENCY);
      const fetched = await Promise.allSettled(
        batch.map((e) => fetchPage(e.loc, source.name, e.lastmod))
      );
      for (const r of fetched) {
        if (r.status === "fulfilled" && r.value) articles.push(r.value);
      }
    }

    recordSuccess(source.name);
    logger.info(`  -> Got ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (err: any) {
    recordFailure(source.name);
    logger.error(`Failed to fetch sitemap for ${source.name}: ${err.message}`);
    return [];
  }
}

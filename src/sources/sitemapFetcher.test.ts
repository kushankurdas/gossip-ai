import { describe, expect, it } from "vitest";
import { parseSitemap } from "./sitemapFetcher";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.example.com/post/first-article</loc>
    <lastmod>2026-05-01T10:00:00Z</lastmod>
  </url>
  <url>
    <loc>https://www.example.com/post/second-article</loc>
    <lastmod>2026-05-02</lastmod>
  </url>
  <url>
    <loc>https://www.example.com/about</loc>
  </url>
  <url>
    <loc>https://www.example.com/post/with-amp?a=1&amp;b=2</loc>
    <lastmod>not-a-real-date</lastmod>
  </url>
</urlset>`;

describe("parseSitemap", () => {
  it("extracts <loc> + <lastmod> pairs", () => {
    const out = parseSitemap(SAMPLE);
    expect(out).toHaveLength(4);
    expect(out[0].loc).toBe("https://www.example.com/post/first-article");
    expect(out[0].lastmod?.toISOString()).toBe("2026-05-01T10:00:00.000Z");
  });

  it("handles missing <lastmod>", () => {
    const out = parseSitemap(SAMPLE);
    const about = out.find((e) => e.loc.endsWith("/about"));
    expect(about?.lastmod).toBeUndefined();
  });

  it("ignores invalid lastmod dates", () => {
    const out = parseSitemap(SAMPLE);
    const amp = out.find((e) => e.loc.includes("with-amp"));
    expect(amp?.lastmod).toBeUndefined();
  });

  it("decodes HTML entities in loc", () => {
    const out = parseSitemap(SAMPLE);
    const amp = out.find((e) => e.loc.includes("with-amp"));
    expect(amp?.loc).toBe("https://www.example.com/post/with-amp?a=1&b=2");
  });

  it("returns empty array on garbage input", () => {
    expect(parseSitemap("<html>not a sitemap</html>")).toEqual([]);
    expect(parseSitemap("")).toEqual([]);
  });
});

const FEED_CACHE_TTL = 5 * 60 * 1000;

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim() || value.trim() === "#") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getImage(item: Record<string, unknown>): string | undefined {
  const media = item["media:content"] as { $?: { url?: string }; url?: string } | undefined;
  const thumbnail = item["media:thumbnail"] as { $?: { url?: string }; url?: string } | undefined;
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  const candidates = [media?.$?.url, media?.url, thumbnail?.$?.url, thumbnail?.url, enclosure?.url];
  return candidates.find((value) => isValidUrl(value));
}

function normalizeItem(item: Record<string, unknown>, feed: RSSFeed): NewsArticle | null {
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const url = typeof item.link === "string" ? item.link.trim() : "";
  if (!title || !isValidUrl(url)) return null;

  const publishedAtValue = item.isoDate || item.pubDate || item.published || item["dc:date"] || item.updated;
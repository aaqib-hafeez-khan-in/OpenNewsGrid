import Parser from "rss-parser";
import { AggregatedStory, NewsArticle, RSSFeed } from "@/types";
import { GLOBAL_RSS_FEEDS } from "./rss-aggregator";
import { extractKeywords, generateId, estimateReadTime } from "./utils";
import { globalCache, generateCacheKey } from "./cache";

const parser = new Parser({
  timeout: 4000,
  maxRedirects: 2,
  headers: {
    "User-Agent": "OpenNewsGrid/1.0 (+https://open-news-grid.vercel.app)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      "media:content",
      "media:thumbnail",
      "enclosure",
      "content:encoded",
      "content",
      "summary",
      "author",
      "creator",
      "dc:creator",
      "dc:date",
      "published",
      "updated",
      "category",
      "categories",
    ],
  },
});

const HOMEPAGE_FEED_COUNT = 24;
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
  const parsedDate = publishedAtValue ? new Date(String(publishedAtValue)) : new Date();
  const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  const description = typeof item.contentSnippet === "string"
    ? item.contentSnippet
    : typeof item.summary === "string"
      ? item.summary
      : typeof item.content === "string"
        ? item.content.replace(/<[^>]*>/g, "").slice(0, 320)
        : "";
  const keywords = extractKeywords(`${title} ${description}`);
  const imageUrl = getImage(item);

  return {
    id: generateId(),
    title,
    description: description.trim(),
    content: typeof item.content === "string" ? item.content : undefined,
    url,
    imageUrl: imageUrl || "",
    source: feed.source,
    author: typeof item.creator === "string" ? item.creator : typeof item.author === "string" ? item.author : undefined,
    publishedAt,
    category: feed.category === "general" ? feed.source.category : feed.category,
    language: feed.source.language,
    country: feed.source.country,
    keywords,
  };
}

function selectHomepageFeeds(): RSSFeed[] {
  const feeds = GLOBAL_RSS_FEEDS.filter((feed) => isValidUrl(feed.url));
  const selected = new Map<string, RSSFeed>();
  const categories = ["general", "world", "technology", "business", "politics"];

  for (const category of categories) {
    for (const feed of feeds.filter((item) => item.category === category)) {
      if (selected.size >= HOMEPAGE_FEED_COUNT) break;
      selected.set(feed.source.id, feed);
    }
    if (selected.size >= HOMEPAGE_FEED_COUNT) break;
  }

  if (selected.size < HOMEPAGE_FEED_COUNT) {
    const step = Math.max(1, Math.floor(feeds.length / HOMEPAGE_FEED_COUNT));
    for (let index = 0; index < feeds.length && selected.size < HOMEPAGE_FEED_COUNT; index += step) {
      selected.set(feeds[index].source.id, feeds[index]);
    }
  }

  return [...selected.values()].slice(0, HOMEPAGE_FEED_COUNT);
}

async function fetchFeed(feed: RSSFeed): Promise<NewsArticle[]> {
  const cacheKey = generateCacheKey("fast-rss", { url: feed.url });
  const cached = globalCache.get<NewsArticle[]>(cacheKey);
  if (cached) return cached;

  try {
    const parsed = await parser.parseURL(feed.url);
    const articles = (parsed.items || [])
      .map((item) => normalizeItem(item as Record<string, unknown>, feed))
      .filter((article): article is NewsArticle => article !== null);
    globalCache.set(cacheKey, articles, FEED_CACHE_TTL);
    return articles;
  } catch {
    return [];
  }
}

function toStory(article: NewsArticle): AggregatedStory {
  return {
    id: article.id,
    headline: article.title,
    summary: article.description,
    imageUrl: article.imageUrl,
    sources: [article.source],
    primaryArticle: article,
    relatedArticles: [],
    category: article.category,
    countries: [article.country],
    languages: [article.language],
    publishedAt: article.publishedAt,
    keywords: article.keywords || [],
    readTime: estimateReadTime(article.content || article.description),
  };
}

export async function getFastHomepageStories(limit = 39): Promise<AggregatedStory[]> {
  const cacheKey = generateCacheKey("homepage-stories", { limit });
  const cached = globalCache.get<AggregatedStory[]>(cacheKey);
  if (cached) return cached;

  const feeds = selectHomepageFeeds();
  const results = await Promise.all(feeds.map((feed) => fetchFeed(feed)));
  const articles = results.flat().sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const stories = articles.slice(0, limit).map(toStory);
  globalCache.set(cacheKey, stories, FEED_CACHE_TTL);
  return stories;
}

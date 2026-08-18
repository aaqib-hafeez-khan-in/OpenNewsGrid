import { AggregatedStory, NewsArticle, NewsFilters } from "@/types";
import { globalCache, generateCacheKey } from "./cache";
import { calculateSimilarity, estimateReadTime, extractKeywords, generateId } from "./utils";
import { ALL_RSS_FEEDS, rssAggregator } from "./rss-aggregator";
import { isValidHttpUrl } from "./url-utils";

const CACHE_TTL = 5 * 60 * 1000;
const MAX_FEEDS = 60;

function cleanArticles(articles: NewsArticle[]): NewsArticle[] {
  return articles
    .filter((article) => article.title?.trim() && isValidHttpUrl(article.url))
    .filter((article) => !article.id.startsWith("mock-"))
    .filter((article, index, list) => index === list.findIndex((item) => item.url === article.url))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = Math.max(page - 1, 0) * limit;
  return items.slice(start, start + limit);
}

class NewsAggregator {
  async fetchRSSFeeds(category?: string, limit = 100): Promise<NewsArticle[]> {
    const cacheKey = generateCacheKey("live-rss", { category, limit });
    const cached = globalCache.get<NewsArticle[]>(cacheKey);
    if (cached) return cached;

    const articles = cleanArticles(
      await rssAggregator.fetchAllFeeds(category, 5, MAX_FEEDS),
    ).slice(0, limit);

    globalCache.set(cacheKey, articles, CACHE_TTL);
    return articles;
  }

  async fetchRSSByRegion(regionId: string, limit = 50): Promise<NewsArticle[]> {
    return cleanArticles(await rssAggregator.fetchByRegion(regionId, limit)).slice(0, limit);
  }

  async fetchRSSByCountry(countryCode: string, limit = 30): Promise<NewsArticle[]> {
    const cacheKey = `live-rss-country:${countryCode}:${limit}`;
    const cached = globalCache.get<NewsArticle[]>(cacheKey);
    if (cached) return cached;

    const feeds = ALL_RSS_FEEDS.filter((feed) => feed.source.country === countryCode).slice(0, 20);
    const results = await Promise.allSettled(feeds.map((feed) => rssAggregator.fetchFeed(feed, 5)));
    const articles = cleanArticles(
      results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
    ).slice(0, limit);

    globalCache.set(cacheKey, articles, CACHE_TTL);
    return articles;
  }

  async fetchAllSources(filters: NewsFilters = {}, page = 1, pageSize = 20): Promise<NewsArticle[]> {
    let articles: NewsArticle[];

    if (filters.country) {
      articles = await this.fetchRSSByCountry(filters.country, Math.max(pageSize * 3, 30));
    } else if (filters.category) {
      articles = await this.fetchRSSFeeds(filters.category, Math.max(pageSize * 3, 30));
    } else {
      articles = await this.fetchRSSFeeds(undefined, Math.max(pageSize * 3, 30));
    }

    if (filters.language) {
      articles = articles.filter((article) => article.language === filters.language);
    }

    if (filters.source) {
      const source = filters.source.toLowerCase();
      articles = articles.filter((article) => article.source.id.toLowerCase() === source || article.source.name.toLowerCase().includes(source));
    }

    if (filters.from) {
      const from = new Date(filters.from).getTime();
      articles = articles.filter((article) => new Date(article.publishedAt).getTime() >= from);
    }

    if (filters.to) {
      const to = new Date(filters.to).getTime();
      articles = articles.filter((article) => new Date(article.publishedAt).getTime() <= to);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase().trim();
      articles = articles.filter((article) => `${article.title} ${article.description}`.toLowerCase().includes(query));
    }

    if (filters.sortBy === "relevance" && filters.query) {
      const queryTerms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
      articles = articles.sort((a, b) => {
        const score = (article: NewsArticle) => queryTerms.reduce((total, term) => total + (article.title.toLowerCase().includes(term) ? 2 : 0) + (article.description.toLowerCase().includes(term) ? 1 : 0), 0);
        return score(b) - score(a);
      });
    }

    return paginate(cleanArticles(articles), page, pageSize);
  }

  async getBreakingNews(limit = 10): Promise<NewsArticle[]> {
    const cacheKey = `live-breaking:${limit}`;
    const cached = globalCache.get<NewsArticle[]>(cacheKey);
    if (cached) return cached;

    const articles = cleanArticles(await this.fetchRSSFeeds(undefined, Math.max(limit * 4, 30)))
      .filter((article) => {
        const age = Date.now() - new Date(article.publishedAt).getTime();
        return age >= 0 && age <= 24 * 60 * 60 * 1000;
      })
      .slice(0, limit);

    globalCache.set(cacheKey, articles, 60 * 1000);
    return articles;
  }

  async getTopStories(category?: string, limit = 20): Promise<AggregatedStory[]> {
    const cacheKey = generateCacheKey("live-top-stories", { category, limit });
    const cached = globalCache.get<AggregatedStory[]>(cacheKey);
    if (cached) return cached;

    const articles = await this.fetchAllSources({ category, sortBy: "publishedAt" }, 1, Math.max(limit * 3, 30));
    const stories = this.aggregateStories(articles).slice(0, limit);
    globalCache.set(cacheKey, stories, CACHE_TTL);
    return stories;
  }

  async getNewsByCategory(category: string, page = 1, limit = 20): Promise<NewsArticle[]> {
    return this.fetchAllSources({ category, sortBy: "publishedAt" }, page, limit);
  }

  async getNewsByCountry(countryCode: string, page = 1, limit = 30): Promise<NewsArticle[]> {
    const articles = await this.fetchRSSByCountry(countryCode, Math.max(page * limit, limit));
    return paginate(articles, page, limit);
  }

  async getNewsByRegion(regionId: string, page = 1, limit = 50): Promise<NewsArticle[]> {
    const articles = await this.fetchRSSByRegion(regionId, Math.max(page * limit, limit));
    return paginate(articles, page, limit);
  }

  private aggregateStories(articles: NewsArticle[]): AggregatedStory[] {
    const stories: AggregatedStory[] = [];

    for (const article of cleanArticles(articles)) {
      const match = stories.find((story) => {
        const titleSimilarity = calculateSimilarity(article.title, story.headline);
        const overlap = article.keywords?.filter((keyword) => story.keywords.includes(keyword)).length || 0;
        return titleSimilarity > 0.6 || overlap >= 2;
      });

      if (match) {
        if (!match.relatedArticles.some((item) => item.url === article.url)) match.relatedArticles.push(article);
        if (!match.sources.some((source) => source.id === article.source.id)) match.sources.push(article.source);
        if (!match.countries.includes(article.country)) match.countries.push(article.country);
        if (!match.languages.includes(article.language)) match.languages.push(article.language);
        continue;
      }

      const keywords = article.keywords || extractKeywords(`${article.title} ${article.description}`);
      stories.push({
        id: generateId(),
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
        keywords,
        readTime: estimateReadTime(article.description),
      });
    }

    return stories.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
}

export const newsAggregator = new NewsAggregator();

export async function getBreakingNews(limit = 10) {
  return newsAggregator.getBreakingNews(limit);
}

export async function getTopStories(category?: string, limit = 20) {
  return newsAggregator.getTopStories(category, limit);
}

export async function searchNews(query: string, filters: NewsFilters = {}, page = 1, limit = 20) {
  return newsAggregator.fetchAllSources({ ...filters, query }, page, limit);
}

export async function getNewsByCategory(category: string, page = 1, limit = 20) {
  return newsAggregator.getNewsByCategory(category, page, limit);
}

export async function getNewsByCountry(countryCode: string, page = 1, limit = 30) {
  return newsAggregator.getNewsByCountry(countryCode, page, limit);
}

export async function getNewsByRegion(regionId: string, page = 1, limit = 50) {
  return newsAggregator.getNewsByRegion(regionId, page, limit);
}

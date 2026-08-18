export function isValidHttpUrl(value: string | undefined): value is string {
  if (!value || value.trim() === "#") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getArticleHref(article: { url: string; title: string; description: string; imageUrl: string; source: { name: string; url: string }; publishedAt: string; category: string; country: string; language: string; author?: string; }): string | null {
  if (!isValidHttpUrl(article.url)) return null;
  const params = new URLSearchParams({
    url: article.url,
    title: article.title.slice(0, 300),
    description: article.description.slice(0, 500),
    image: article.imageUrl,
    source: article.source.name,
    sourceUrl: article.source.url,
    publishedAt: article.publishedAt,
    category: article.category,
    country: article.country,
    language: article.language,
  });
  if (article.author) params.set("author", article.author.slice(0, 200));
  return `/article?${params.toString()}`;
}

export function getSourceFavicon(sourceUrl: string): string | null {
  if (!isValidHttpUrl(sourceUrl)) return null;
  try {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(sourceUrl).hostname)}&sz=64`;
  } catch {
    return null;
  }
}

export function isValidHttpUrl(value: string | undefined): value is string {
  if (!value || value.trim() === "#") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildPreview(article: { description: string; content?: string }): string {
  const description = article.description.trim();
  if (description.length >= 700) return description.slice(0, 1200).trim();

  const content = (article.content || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!content || content === description) return description.slice(0, 1200).trim();

  const combined = `${description} ${content}`.trim();
  return combined.slice(0, 1200).trim();
}

export function getArticleHref(article: { url: string; title: string; description: string; content?: string; imageUrl: string; source: { name: string; url: string }; publishedAt: string; category: string; country: string; language: string; author?: string; }): string | null {
  if (!isValidHttpUrl(article.url)) return null;
  const params = new URLSearchParams({
    url: article.url,
    title: article.title.slice(0, 300),
    description: buildPreview(article),
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

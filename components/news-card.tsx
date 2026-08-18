"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, ExternalLink, Globe2 } from "lucide-react";
import { NewsArticle, AggregatedStory } from "@/types";
import { formatTimeAgo, estimateReadTime, truncateText, getFlagEmoji } from "@/lib/utils";
import { getArticleHref, getSourceFavicon } from "@/lib/url-utils";

interface NewsCardProps {
  article?: NewsArticle;
  story?: AggregatedStory;
  variant?: "default" | "featured" | "compact" | "horizontal";
}

export function NewsCard({ article, story, variant = "default" }: NewsCardProps) {
  const data = story || (article
    ? ({
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
        readTime: estimateReadTime(article.description),
      } as AggregatedStory)
    : null);

  if (!data) return null;

  const readTime = data.readTime || estimateReadTime(data.summary);
  const hasMultipleSources = data.sources.length > 1;
  const source = data.primaryArticle.source;
  const sourceLabel = hasMultipleSources ? `${data.sources.length} sources` : source.name;
  const articleHref = getArticleHref(data.primaryArticle);
  const favicon = getSourceFavicon(source.url);
  const content = (children: React.ReactNode) =>
    articleHref ? <Link href={articleHref} className="block">{children}</Link> : <div>{children}</div>;

  const sourceBadge = (
    <div className="flex min-w-0 items-center gap-2">
      {favicon ? (
        <img src={favicon} alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-sm shrink-0" loading="lazy" />
      ) : (
        <Globe2 className="h-4 w-4 shrink-0 text-primary" />
      )}
      <span className="truncate font-medium text-primary">{sourceLabel}</span>
    </div>
  );

  if (variant === "featured") {
    return (
      <article className="group relative overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800">
        {content(
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative h-64 min-h-[300px] overflow-hidden md:h-full">
              <Image src={data.imageUrl} alt={data.headline} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="mb-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">{data.category}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center p-6 md:p-8">
              <div className="mb-3 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                {sourceBadge}
                <span>•</span>
                <span>{formatTimeAgo(data.publishedAt)}</span>
              </div>
              <h2 className="mb-4 font-serif text-2xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-primary dark:text-white md:text-3xl">{data.headline}</h2>
              <p className="mb-4 line-clamp-3 text-base text-gray-600 dark:text-gray-300">{data.summary}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{readTime} min read</span>
                {hasMultipleSources && <span className="flex items-center gap-1 text-primary"><span className="text-xs">View all perspectives</span><ExternalLink className="h-3 w-3" /></span>}
              </div>
            </div>
          </div>,
        )}
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="group flex gap-4 overflow-hidden rounded-lg bg-white shadow transition-all duration-300 hover:shadow-lg dark:bg-gray-800">
        {content(
          <div className="flex flex-1 gap-4 p-4">
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg md:h-28 md:w-40">
              <Image src={data.imageUrl} alt={data.headline} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="160px" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><span className="font-medium text-primary">{data.category}</span><span>•</span>{sourceBadge}</div>
              <h3 className="mb-1 line-clamp-2 font-serif text-base font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">{data.headline}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400"><span>{formatTimeAgo(data.publishedAt)}</span><span>•</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readTime} min</span></div>
            </div>
          </div>,
        )}
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group">
        {content(
          <div className="flex items-start gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-700">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"><Image src={data.imageUrl} alt={data.headline} fill className="object-cover" sizes="64px" /></div>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">{data.headline}</h4>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><span className="truncate">{sourceLabel}</span><span>•</span><span>{formatTimeAgo(data.publishedAt)}</span></div>
            </div>
          </div>,
        )}
      </article>
    );
  }

  return (
    <article className="news-card group overflow-hidden rounded-xl bg-white shadow transition-all duration-300 hover:shadow-xl dark:bg-gray-800">
      {content(
        <>
          <div className="image-zoom relative h-48 overflow-hidden">
            <Image src={data.imageUrl} alt={data.headline} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute left-3 top-3"><span className="inline-block rounded bg-accent/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">{data.category}</span></div>
          </div>
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">{sourceBadge}{hasMultipleSources && <span className="inline-flex shrink-0 items-center rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">+{data.sources.length - 1} more</span>}</div>
            <h3 className="mb-2 line-clamp-2 font-serif text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">{data.headline}</h3>
            <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{truncateText(data.summary, 120)}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-3"><span>{formatTimeAgo(data.publishedAt)}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readTime} min</span></div>
              {data.countries.length > 0 && <span className="text-base" title={`Countries: ${data.countries.join(", ")}`}>{data.countries.slice(0, 2).map((c) => getFlagEmoji(c)).join(" ")}</span>}
            </div>
          </div>
        </>,
      )}
    </article>
  );
}

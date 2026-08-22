"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArticleSkeleton } from "@/components/skeletons";
import { ArrowLeft, ExternalLink, Share2, Clock, Calendar, Globe, Bookmark, ChevronRight } from "lucide-react";
import { formatDate, formatTimeAgo, estimateReadTime, getFlagEmoji } from "@/lib/utils";

interface ArticleData {
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl: string;
  source: { name: string; url: string };
  author?: string;
  publishedAt: string;
  category: string;
  country: string;
  language: string;
}

function getParam(params: URLSearchParams, key: string, fallback = ""): string {
  return params.get(key)?.trim() || fallback;
}

function ArticleContent() {
  const searchParams = useSearchParams();
  const articleUrl = searchParams.get("url");
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleUrl) {
      setError("No article URL provided");
      setIsLoading(false);
      return;
    }

    try {
      const url = decodeURIComponent(articleUrl);
      new URL(url);
      const title = getParam(searchParams, "title", "Article");
      const description = getParam(searchParams, "description", "");
      const imageUrl = getParam(searchParams, "image", "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=85");
      const sourceName = getParam(searchParams, "source", "News source");
      const sourceUrl = getParam(searchParams, "sourceUrl", url);
      const publishedAt = getParam(searchParams, "publishedAt", new Date().toISOString());
      const category = getParam(searchParams, "category", "general");
      const country = getParam(searchParams, "country", "us");
      const language = getParam(searchParams, "language", "en");
      const author = getParam(searchParams, "author", "");

      setArticle({
        title,
        description,
        url,
        imageUrl,
        source: { name: sourceName, url: sourceUrl },
        author: author || undefined,
        publishedAt,
        category,
        country,
        language,
      });
      setIsLoading(false);
    } catch {
      setError("Invalid article URL");
      setIsLoading(false);
    }
  }, [articleUrl, searchParams]);

  if (isLoading) return <ArticleSkeleton />;

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-red-500 mb-4">{error || "Article not found"}</p>
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const readTime = estimateReadTime(`${article.description} ${article.content || ""}`);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {}
  };

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary dark:text-gray-400">
          <ArrowLeft className="h-4 w-4" />
          Back to news
        </Link>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {article.category}
        </span>
      </div>

      <header className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        <div className="relative h-56 sm:h-72 md:h-80">
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
              <Globe className="h-4 w-4 text-primary" />
              {article.source.name}
            </span>
            {article.country && <span>{getFlagEmoji(article.country)}</span>}
            <span>•</span>
            <span>{formatTimeAgo(article.publishedAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readTime} min read</span>
          </div>

          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-gray-950 dark:text-white sm:text-4xl md:text-[2.7rem]">
            {article.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            {article.author && <span className="font-medium text-gray-700 dark:text-gray-300">By {article.author}</span>}
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(article.publishedAt)}</span>
          </div>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">In Brief</p>
            <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">What happened</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">Preview</span>
        </div>

        <p className="text-lg leading-8 text-gray-700 dark:text-gray-200 sm:text-xl sm:leading-9">
          {article.description}
        </p>

        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            This summary is based on the publisher&apos;s available feed content. The complete article, additional context, and full reporting remain on the original publisher site.
          </p>
        </div>
      </section>

      <div className="mt-6 rounded-2xl bg-primary p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Read the full story</p>
            <h3 className="mt-1 text-xl font-bold">Continue on {article.source.name}</h3>
            <p className="mt-1 text-sm text-white/75">Open the original publisher page for the complete article.</p>
          </div>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-primary transition-colors hover:bg-gray-100">
            Read full story
            <ChevronRight className="h-5 w-5" />
          </a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700">
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button type="button" onClick={() => window.localStorage.setItem(`opennewsgrid:bookmark:${article.url}`, JSON.stringify(article))} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700">
          <Bookmark className="h-4 w-4" />
          Save
        </button>
      </div>

      <footer className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Originally published by <a href={article.source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{article.source.name}</a>
        </p>
      </footer>
    </article>
  );
}

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900 sm:py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<ArticleSkeleton />}><ArticleContent /></Suspense>
      </div>
    </div>
  );
}

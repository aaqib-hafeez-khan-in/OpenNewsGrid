"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArticleSkeleton } from "@/components/skeletons";
import { ArrowLeft, ExternalLink, Share2, Clock, Calendar, Globe, Bookmark } from "lucide-react";
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
      const imageUrl = getParam(searchParams, "image", "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80");
      const sourceName = getParam(searchParams, "source", "News source");
      const sourceUrl = getParam(searchParams, "sourceUrl", url);
      const publishedAt = getParam(searchParams, "publishedAt", new Date().toISOString());
      const category = getParam(searchParams, "category", "general");
      const country = getParam(searchParams, "country", "us");
      const language = getParam(searchParams, "language", "en");
      const author = getParam(searchParams, "author", "");

      setArticle({ title, description, url, imageUrl, source: { name: sourceName, url: sourceUrl }, author: author || undefined, publishedAt, category, country, language });
      setIsLoading(false);
    } catch {
      setError("Invalid article URL");
      setIsLoading(false);
    }
  }, [articleUrl, searchParams]);

  if (isLoading) return <ArticleSkeleton />;

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-red-500 mb-4">{error || "Article not found"}</p>
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const readTime = estimateReadTime(article.description + (article.content || ""));

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
    <article className="max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to news
      </Link>

      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium uppercase">{article.category}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{article.source.name}</span>
          {article.country && <><span>•</span><span>{getFlagEmoji(article.country)}</span></>}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {article.author && <span className="font-medium text-gray-700 dark:text-gray-300">By {article.author}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(article.publishedAt)}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{readTime} min read</span>
          <span>{formatTimeAgo(article.publishedAt)}</span>
        </div>
      </header>

      <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority sizes="(max-width: 896px) 100vw, 896px" />
      </div>

      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
          <ExternalLink className="h-4 w-4" />
          Read Original Article
        </a>
        <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button type="button" onClick={() => window.localStorage.setItem(`opennewsgrid:bookmark:${article.url}`, JSON.stringify(article))} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
          <Bookmark className="h-4 w-4" />
          Save
        </button>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-6 font-medium">{article.description}</p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">This is a preview of the article. Read the full story on the publisher&apos;s website.</p>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            Continue reading on {article.source.name}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">Originally published by <a href={article.source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{article.source.name}</a></p>
      </div>
    </article>
  );
}

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<ArticleSkeleton />}><ArticleContent /></Suspense>
      </div>
    </div>
  );
}

import { BreakingNews } from "@/components/breaking-news";
import { NewsGrid } from "@/components/news-grid";
import { getTopStories } from "@/lib/news-aggregator";
import { getArticleHref, getSourceFavicon } from "@/lib/url-utils";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Globe, ExternalLink } from "lucide-react";

export const revalidate = 60;

function SidebarStory({ article }: { article: Awaited<ReturnType<typeof getTopStories>>[number]["primaryArticle"] }) {
  const href = getArticleHref(article);
  if (!href) return null;
  const favicon = getSourceFavicon(article.source.url);

  return (
    <Link href={href} className="group flex gap-3">
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="80px" />
      </div>
      <div className="min-w-0">
        <h4 className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">
          {article.title}
        </h4>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {favicon ? <img src={favicon} alt="" width={14} height={14} className="h-3.5 w-3.5 rounded-sm" loading="lazy" /> : null}
          <span className="truncate">{article.source.name}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const stories = await getTopStories(undefined, 39);
  const featuredStory = stories[0];
  const mainGridStories = stories.slice(1, 7);
  const worldNews = stories.filter((story) => story.category === "world").slice(0, 5).map((story) => story.primaryArticle);
  const techNews = stories.filter((story) => story.category === "technology").slice(0, 4).map((story) => story.primaryArticle);
  const businessNews = stories.filter((story) => story.category === "business").slice(0, 4).map((story) => story.primaryArticle);
  const breakingNews = stories
    .filter((story) => Date.now() - new Date(story.publishedAt).getTime() >= 0 && Date.now() - new Date(story.publishedAt).getTime() <= 24 * 60 * 60 * 1000)
    .slice(0, 8)
    .map((story) => story.primaryArticle);
  const keywords = featuredStory?.keywords?.slice(0, 8) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BreakingNews articles={breakingNews} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {featuredStory && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Story</h2>
            </div>
            <NewsGrid stories={[featuredStory]} variant="default" columns={1} showFeatured />
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Headlines</h2>
                </div>
                <Link href="/general" className="text-sm font-medium text-primary hover:text-primary-dark">View All →</Link>
              </div>
              <NewsGrid stories={mainGridStories} variant="default" columns={2} showFeatured={false} />
            </section>

            {worldNews.length > 0 && (
              <section className="mb-12">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">World News</h2>
                  <Link href="/world" className="text-sm font-medium text-primary hover:text-primary-dark">More World →</Link>
                </div>
                <NewsGrid articles={worldNews} variant="horizontal" columns={1} showFeatured={false} />
              </section>
            )}
          </div>

          <aside className="space-y-8">
            {keywords.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
                <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Trending Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Link key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-primary hover:text-white dark:bg-gray-700 dark:text-gray-300">
                      #{keyword}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {techNews.length > 0 && (
              <section className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">Technology</h3>
                  <Link href="/technology" className="text-sm text-primary">More →</Link>
                </div>
                <div className="space-y-4">{techNews.map((article) => <SidebarStory key={article.id} article={article} />)}</div>
              </section>
            )}

            {businessNews.length > 0 && (
              <section className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">Business</h3>
                  <Link href="/business" className="text-sm text-primary">More →</Link>
                </div>
                <div className="space-y-4">{businessNews.map((article) => <SidebarStory key={article.id} article={article} />)}</div>
              </section>
            )}

            <div className="rounded-xl bg-primary p-6 text-white shadow">
              <h3 className="mb-2 text-lg font-bold">OpenNewsGrid</h3>
              <p className="mb-4 text-sm text-white/80">Live stories collected directly from publisher feeds.</p>
              <Link href="/search" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-gray-100">
                Explore News <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { getBreakingNews, getTopStories, searchNews, getNewsByCategory } from "@/lib/news-aggregator";
import { NewsFilters } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const MAX_LIMIT = 50;
const MAX_PAGE = 1000;
const MAX_QUERY_LENGTH = 200;

function positiveInt(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), max) : fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "top";
    const category = searchParams.get("category") || undefined;
    const rawQuery = searchParams.get("q") || "";
    const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
    const page = positiveInt(searchParams.get("page"), 1, MAX_PAGE);
    const limit = positiveInt(searchParams.get("limit"), 20, MAX_LIMIT);
    const country = searchParams.get("country") || undefined;
    const language = searchParams.get("language") || undefined;

    if (!["breaking", "top", "search", "category"].includes(action)) {
      return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
    }

    let data;

    switch (action) {
      case "breaking":
        data = await getBreakingNews(limit);
        break;
      case "top":
        data = await getTopStories(category, limit);
        break;
      case "search": {
        const searchFilters: NewsFilters = { category, country, language };
        data = await searchNews(query, searchFilters, page, limit);
        break;
      }
      case "category":
        data = await getNewsByCategory(category || "general", page, limit);
        break;
    }

    return NextResponse.json({ success: true, data, meta: { action, page, limit, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

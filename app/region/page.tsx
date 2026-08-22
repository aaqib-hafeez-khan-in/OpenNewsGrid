import { Metadata } from "next";
import Link from "next/link";
import { Globe2, MapPin } from "lucide-react";
import { COUNTRIES, REGIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Regions - Global News Daily",
  description: "Browse news by region and country.",
};

interface RegionPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function RegionIndexPage({ searchParams }: RegionPageProps) {
  const { filter } = await searchParams;
  const showCountries = filter === "country";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe2 className="h-8 w-8" />
            <span className="text-white/80 text-lg">Browse</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Regions & Countries
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Explore global news by region or jump directly to a country.
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/region"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !showCountries ? "bg-white text-primary" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Regions
            </Link>
            <Link
              href="/region?filter=country"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                showCountries ? "bg-white text-primary" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Countries
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {showCountries ? (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Countries
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {COUNTRIES.map((country) => (
                <Link
                  key={country.code}
                  href={`/country/${country.code}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {country.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {country.region.replaceAll("-", " ")}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Regions
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {REGIONS.map((region) => (
                <Link
                  key={region.id}
                  href={`/region/${region.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {region.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {region.countries.length} countries · {region.languages.length} languages
                      </p>
                    </div>
                    <Globe2 className="h-6 w-6 text-primary shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

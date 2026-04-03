import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CosmicHero } from "@/components/home/CosmicHero";
import { PremiumFeaturedSection } from "@/components/home/PremiumFeaturedSection";
import { SeasonalSection } from "@/components/home/SeasonalSection";
import { SpaceSection } from "@/components/home/SpaceSection";
import { animeService } from "@/lib/UnifiedAnimeService";

export const revalidate = 3600;

// ── Server Component Data Fetching ─────────────────────────
async function getData() {
  try {
    const [seasonalAnimes, latest, topRated] = await Promise.all([
      animeService.getFeaturedAnimes(),
      animeService.getLatest(28),
      animeService.getTopRated(16)
    ]);

    return {
      seasonalAnimes,
      latest,
      topRated,
      trending: latest.slice(0, 12)
    };
  } catch (error) {
    console.error("Critical Error fetching home data:", error);
    return {
      seasonalAnimes: [],
      latest: [],
      topRated: [],
      trending: []
    };
  }
}

// ── Main Home Engine (Server Rendered) ─────────────────────────────────────
export default async function Home() {
  const { seasonalAnimes, latest, topRated, trending } = await getData();

  // Smart Hero selection: Prioritize Seasonal Animes
  const heroItems = seasonalAnimes.length > 0 
    ? seasonalAnimes 
    : [...trending.slice(0, 10), ...topRated.slice(0, 5)].sort(() => Math.random() - 0.5);

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-[#00F0FF]/30 selection:text-white">
      <Header />
      <main className="pb-20">
        <Suspense fallback={<div className="h-[90vh] bg-[#050505] animate-pulse" />}>
          <CosmicHero items={heroItems} />
        </Suspense>

        <div className="container mx-auto px-0 sm:px-2 max-w-[1600px] mt-6 sm:mt-10">
          <SeasonalSection
            title="أنميات الموسم"
            items={seasonalAnimes}
          />

          <div className="space-y-4">
            <SpaceSection title="أحدث الإصدارات" icon="Flame" items={latest} />
            <SpaceSection
              title="الأكثر شهرة الآن"
              icon="Sparkles"
              items={trending}
            />
            <SpaceSection
              title="أعلى التقييمات عبر التاريخ"
              icon="Star"
              items={topRated}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

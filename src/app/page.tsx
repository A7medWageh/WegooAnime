import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CosmicHero } from "@/components/home/CosmicHero";
import { PremiumFeaturedSection } from "@/components/home/PremiumFeaturedSection";
import { SpaceSection } from "@/components/home/SpaceSection";
import { animeService } from "@/lib/UnifiedAnimeService";

export const revalidate = 3600;

// ── Server Component Data Fetching ─────────────────────────
async function getData() {
  try {
    const [airingNow, latest, topRated] = await Promise.all([
      animeService.getAiring(15),
      animeService.getLatest(40),
      animeService.getTopRated(20)
    ]);

    return {
      latest,
      topRated,
      trending: latest.slice(0, 15),
      airingNow
    };
  } catch (error) {
    console.error("Critical Error fetching home data:", error);
    return {
      latest: [],
      topRated: [],
      trending: [],
      airingNow: []
    };
  }
}

// ── Main Home Engine (Server Rendered) ─────────────────────────────────────
export default async function Home() {
  const { latest, topRated, trending, airingNow } = await getData();

  const heroItems = airingNow.length ? airingNow : trending;

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-[#00F0FF]/30 selection:text-white">
      <Header />
      <main className="pb-20">
        <Suspense fallback={<div className="h-[90vh] bg-[#050505] animate-pulse" />}>
          <CosmicHero items={heroItems} />
        </Suspense>

        <div className="container mx-auto px-0 sm:px-2 max-w-[1600px] mt-6 sm:mt-10">
          <PremiumFeaturedSection
            title="جديد الحلقات وإضافات اليوم"
            icon="Zap"
            items={airingNow}
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

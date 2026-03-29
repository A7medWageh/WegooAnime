import { PrismaClient, AnimeStatus, AnimeType } from '@prisma/client';

const prisma = new PrismaClient();

const animeData = [
  {
    title: 'ون بيس',
    titleEnglish: 'One Piece',
    titleJapanese: 'ワンピース',
    slug: 'one-piece',
    tmdbId: 37854,
    synopsis: 'مونكي دي لوفي فتى يحلم بأن يصبح ملك القراصنة. في رحلته للبحث عن الكنز الأسطوري "ون بيس"، يجمع طاقما من الأصدقاء ويواجه مغامرات لا تنتهي.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1244/138851l.jpg',
    rating: 9.0,
    year: 1999,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 1100,
    genres: ['أكشن', 'مغامرة', 'كوميديا', 'فانتازيا'],
  },
  {
    title: 'ناروتو شيبودن',
    titleEnglish: 'Naruto Shippuden',
    titleJapanese: 'ナルト疾風伝',
    slug: 'naruto-shippuden',
    tmdbId: 31910,
    synopsis: 'بعد عامين ونصف العام من التدريب، يعود ناروتو إلى القرية لمواجهة منظمة الأكاتسوكي وإنقاذ صديقه ساسكي.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1565/111305.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1565/111305l.jpg',
    rating: 8.7,
    year: 2007,
    status: AnimeStatus.COMPLETED,
    type: AnimeType.TV,
    totalEpisodes: 500,
    genres: ['أكشن', 'مغامرة', 'فانتازيا', 'شونين'],
  },
  {
    title: 'Attack on Titan',
    titleEnglish: 'Attack on Titan',
    titleJapanese: '進撃の巨人',
    slug: 'attack-on-titan',
    tmdbId: 1429,
    synopsis: 'البشرية تعيش خلف جدران ضخمة للحماية من العمالقة الذين يأكلون البشر. إيرين يقسم على القضاء على جميع العمالقة بعد أن دمر أحدهم مدينته.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1000/110531.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1000/110531l.jpg',
    rating: 9.1,
    year: 2013,
    status: AnimeStatus.COMPLETED,
    type: AnimeType.TV,
    totalEpisodes: 87,
    genres: ['أكشن', 'دراما', 'فانتازيا', 'غموض'],
  },
  {
    title: 'Demon Slayer',
    titleEnglish: 'Demon Slayer: Kimetsu no Yaiba',
    titleJapanese: '鬼滅の刃',
    slug: 'demon-slayer-kimetsu-no-yaiba',
    tmdbId: 85937,
    synopsis: 'تانجيرو كامادو فتى لطيف يبيع الفحم لعيشه. بعد مقتل عائلته على يد شيطان، ينضم لفريق صائدي الشياطين للانتقام.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    rating: 8.6,
    year: 2019,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 55,
    genres: ['أكشن', 'فانتازيا', 'شونين'],
  },
  {
    title: 'Jujutsu Kaisen',
    titleEnglish: 'Jujutsu Kaisen',
    titleJapanese: '呪術廻戦',
    slug: 'jujutsu-kaisen',
    tmdbId: 95479,
    synopsis: 'إيتادوري يوجي طالب ثانوي يبتلع إصبع لعنة قديمة ويصبح مضيفاً لملك اللعنات سوكونا.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
    rating: 8.7,
    year: 2020,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 47,
    genres: ['أكشن', 'فانتازيا', 'شونين'],
  },
  {
    title: 'Spy x Family',
    titleEnglish: 'Spy x Family',
    titleJapanese: 'スパイファミリー',
    slug: 'spy-x-family',
    tmdbId: 114355,
    synopsis: 'جاسوس يجب أن يأسس عائلة زائفة لتنفيذ مهمة، لكنه لا يعلم أن ابنته قارئة للأفكار وزوجته قاتلة محترفة.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1441/122795l.jpg',
    rating: 8.6,
    year: 2022,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 37,
    genres: ['أكشن', 'كوميديا', 'شونين'],
  },
  {
    title: 'My Hero Academia',
    titleEnglish: 'My Hero Academia',
    titleJapanese: '僕のヒーローアカデミア',
    slug: 'my-hero-academia',
    tmdbId: 65930,
    synopsis: 'في عالم حيث 80% من البشر يمتلكون قدرات خارقة، إيزوكو ميدوريا ولد بلا قدرة لكنه يحلم بأن يصبح بطلاً.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1908/135431.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1908/135431l.jpg',
    rating: 8.0,
    year: 2016,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 138,
    genres: ['أكشن', 'كوميديا', 'شونين'],
  },
  {
    title: 'Death Note',
    titleEnglish: 'Death Note',
    titleJapanese: 'デスノート',
    slug: 'death-note',
    tmdbId: 1396,
    synopsis: 'طالب ثانوي يجد دفتر موتى يسقط من السماء. أي اسم يكتب في الدفتر يموت، فيقرر استخدام لتنفيذ العدالة.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',
    rating: 8.6,
    year: 2006,
    status: AnimeStatus.COMPLETED,
    type: AnimeType.TV,
    totalEpisodes: 37,
    genres: ['غموض', 'دراما', 'نفسي'],
  },
  {
    title: 'Fullmetal Alchemist: Brotherhood',
    titleEnglish: 'Fullmetal Alchemist: Brotherhood',
    titleJapanese: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    slug: 'fullmetal-alchemist-brotherhood',
    tmdbId: 31906,
    synopsis: 'أخوان يبحثان عن حجر الفيلسوف لاستعادة أجسادهما بعد محاولة فاشلة لإحياء أمهما باستخدام الخيمياء.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
    rating: 9.1,
    year: 2009,
    status: AnimeStatus.COMPLETED,
    type: AnimeType.TV,
    totalEpisodes: 64,
    genres: ['أكشن', 'مغامرة', 'دراما', 'فانتازيا'],
  },
  {
    title: 'Chainsaw Man',
    titleEnglish: 'Chainsaw Man',
    titleJapanese: 'チェンソーマン',
    slug: 'chainsaw-man',
    tmdbId: 206551,
    synopsis: 'دينجي شاب فقير يعمل كصياد شياطين مع كلبه بوتشيتا. بعد مقتله، يندمج مع بوتشيتا ويصبح رجل المنشار.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',
    rating: 8.5,
    year: 2022,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 12,
    genres: ['أكشن', 'فانتازيا', 'شونين'],
  },
  {
    title: 'Solo Leveling',
    titleEnglish: 'Solo Leveling',
    titleJapanese: '俺だけレベルアップな件',
    slug: 'solo-leveling',
    tmdbId: 205261,
    synopsis: 'سونغ جين وو أضعف صياد في العالم. بعد موته في زنزانة، يحصل على قدرة غامضة تسمح له بالارتقاء بالمستويات.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1139/138804.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1139/138804l.jpg',
    rating: 8.3,
    year: 2024,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 12,
    genres: ['أكشن', 'فانتازيا', 'شونين'],
  },
  {
    title: 'Blue Lock',
    titleEnglish: 'Blue Lock',
    titleJapanese: 'ブルーロック',
    slug: 'blue-lock',
    tmdbId: 206552,
    synopsis: 'برنامج تدريبي لاختيار أفضل مهاجم في اليابان. 300 لاعب شاب يتنافسون في مرفق سري ليصبحوا الملك.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1258/126929.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1258/126929l.jpg',
    rating: 8.2,
    year: 2022,
    status: AnimeStatus.ONGOING,
    type: AnimeType.TV,
    totalEpisodes: 24,
    genres: ['رياضة', 'دراما', 'شونين'],
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create genres first
  const allGenres = new Set<string>();
  animeData.forEach(anime => {
    anime.genres.forEach(g => allGenres.add(g));
  });

  console.log('Creating genres...');
  for (const genreName of allGenres) {
    await prisma.genre.upsert({
      where: { slug: genreName.toLowerCase().replace(/\s+/g, '-') },
      create: {
        name: genreName,
        slug: genreName.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {},
    });
  }

  // Create anime and episodes
  console.log('Creating anime and episodes...');
  for (const anime of animeData) {
    const createdAnime = await prisma.anime.upsert({
      where: { slug: anime.slug },
      create: {
        title: anime.title,
        titleEnglish: anime.titleEnglish,
        titleJapanese: anime.titleJapanese,
        slug: anime.slug,
        synopsis: anime.synopsis,
        coverImage: anime.coverImage,
        bannerImage: anime.bannerImage,
        rating: anime.rating,
        year: anime.year,
        status: anime.status,
        type: anime.type,
        totalEpisodes: anime.totalEpisodes,
        malId: anime.tmdbId, // Using malId field for TMDB ID
      },
      update: {
        title: anime.title,
        titleEnglish: anime.titleEnglish,
        synopsis: anime.synopsis,
        coverImage: anime.coverImage,
        bannerImage: anime.bannerImage,
        rating: anime.rating,
        totalEpisodes: anime.totalEpisodes,
        malId: anime.tmdbId,
      },
    });

    // Connect genres
    for (const genreName of anime.genres) {
      const genre = await prisma.genre.findUnique({
        where: { slug: genreName.toLowerCase().replace(/\s+/g, '-') },
      });
      if (genre) {
        await prisma.animeGenre.upsert({
          where: {
            animeId_genreId: {
              animeId: createdAnime.id,
              genreId: genre.id,
            },
          },
          create: {
            animeId: createdAnime.id,
            genreId: genre.id,
          },
          update: {},
        });
      }
    }

    // Create episodes (only first 24 for demo)
    const episodesToCreate = Math.min(anime.totalEpisodes || 12, 24);
    for (let i = 1; i <= episodesToCreate; i++) {
      await prisma.episode.upsert({
        where: {
          animeId_number: {
            animeId: createdAnime.id,
            number: i,
          },
        },
        create: {
          animeId: createdAnime.id,
          number: i,
          title: `الحلقة ${i}`,
          titleEnglish: `Episode ${i}`,
          slug: `${anime.slug}-episode-${i}`,
        },
        update: {
          title: `الحلقة ${i}`,
          titleEnglish: `Episode ${i}`,
        },
      });
    }

    console.log(`✅ Created ${anime.title} (TMDB: ${anime.tmdbId}) with ${episodesToCreate} episodes`);
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

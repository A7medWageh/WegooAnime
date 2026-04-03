import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.myanimelist.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'witanime.life',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wb.animeluxe.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'animeluxe.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'anime.delivery',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.kitsu.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kitsu.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.anime.nexus',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'anime.nexus',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'anime-slayer.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.anime-slayer.com',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { Search, Rocket, Video, Crown, Compass, Tv, X, Play, Loader2, Menu, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';

const navLinks = [
  { href: '/top', label: 'الأكثر شهرة', icon: Crown },
  { href: '/search', label: 'أحدث الإصدارات', icon: Compass },
  { href: '/series', label: 'مسلسلات', icon: Tv },
  { href: '/movies', label: 'أفلام', icon: Video },
  { href: '/favorites', label: 'المفضلة', icon: Heart },
  { href: '/categories', label: 'التصنيفات', icon: Search },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return scrollY.onChange((latest) => { setIsScrolled(latest > 50); });
  }, [scrollY]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  // Real-time search fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/anime?action=search&limit=5&q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setResults(data.data);
        })
        .catch(err => console.error("Search fetch error:", err))
        .finally(() => setIsSearching(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-4 sm:pt-6 px-4 pointer-events-none"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      dir="rtl"
    >
      <motion.div
        className={`pointer-events-auto relative flex items-center justify-between w-full max-w-7xl px-4 sm:px-5 lg:px-6 py-2.5 rounded-[2rem] sm:rounded-full border border-white/10 shadow-2xl transition-all duration-500 will-change-[background-color,backdrop-filter] ${
          isScrolled ? 'bg-[#030014]/85 backdrop-blur-lg shadow-[#00F0FF]/15' : 'bg-[#030014]/50 backdrop-blur-md shadow-black/50'
        }`}
        initial={false}
      >
        <Link href="/" className="flex-shrink-0">
          <Logo />
        </Link>

        {/* Nav Links (Always visible on desktop) */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-white/5 p-1 rounded-full border border-white/5 z-10 transition-all duration-300">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className="relative px-3 xl:px-5 py-2.5 rounded-full text-[13px] xl:text-sm font-bold transition-colors group">
                {isActive && (
                  <motion.div
                    layoutId="navBlob"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white font-black' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  <link.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'opacity-70'}`} />
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions & Search */}
        <div className="flex items-center gap-2 sm:gap-3 z-10 flex-shrink-0" ref={searchRef}>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors group ${isSearchOpen ? 'bg-white/10 border-[#00F0FF]/50 text-[#00F0FF]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
              }`}
          >
            {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4 group-hover:text-[#00F0FF] transition-colors" />}
          </button>

          <button className="hidden sm:flex relative items-center justify-center px-5 sm:px-6 py-2 rounded-full font-bold text-sm text-[#0a0a0a] bg-white overflow-hidden group hover:bg-gray-200 transition-colors flex-shrink-0 whitespace-nowrap">
            <span className="relative z-10 transition-colors duration-300">التسجيل</span>
          </button>

          {/* Hamburger Menu Toggle (Mobile & Tablet) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Dropdown Search Bar Container */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-[120%] left-4 right-4 sm:left-6 sm:w-[350px] sm:right-auto md:w-[400px] pointer-events-auto"
            >
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="ابحث عن الأنمي المفضل لديك..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery) {
                      setIsSearchOpen(false);
                      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                  className="w-full h-12 bg-black/80 border border-[#00F0FF]/50 rounded-2xl px-12 text-base text-white focus:outline-none focus:ring-1 focus:ring-[#00F0FF] placeholder:text-gray-500 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
                />
                <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Real-time Results Dropdown */}
              <AnimatePresence>
                {searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-[#0B0033]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-1 max-h-[400px] overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 text-[#00F0FF] animate-spin" /></div>
                    ) : results.length > 0 ? (
                      <>
                        {results.map((anime) => (
                          <Link
                            key={anime.id} href={`/anime/${anime.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors group"
                          >
                            <img src={anime.image} alt={anime.title} className="w-12 h-16 object-cover rounded-md shadow-md" />
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-gray-300 transition-colors">{anime.title}</h4>
                              <p className="text-xs text-gray-400 mt-1">{anime.type} • {anime.rating || 'N/A'}</p>
                            </div>
                          </Link>
                        ))}
                        <Link
                          href={`/search?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="text-center text-xs font-bold text-white bg-white/5 hover:bg-white/10 p-3 mt-2 rounded-xl transition-colors"
                        >
                          عرض كل النتائج
                        </Link>
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-400">لا توجد نتائج مطابقة</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Full-Screen Blurred Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-[#0B0033]/80 flex flex-col items-center justify-center pointer-events-auto"
          >
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] transition-colors shadow-lg border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center gap-6 mt-10 w-full px-8">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="mb-8 scale-125">
                <Logo />
              </Link>
              {navLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="w-full"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-2xl w-full text-lg font-bold transition-all ${isActive ? 'bg-gradient-to-r from-[#00F0FF]/20 to-transparent text-[#00F0FF] border border-[#00F0FF]/30' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      <link.icon className={`w-6 h-6 ${isActive ? 'text-[#00F0FF]' : 'opacity-70'}`} />
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
                className="w-full mt-4"
              >
                <button className="w-full py-4 rounded-2xl font-black text-lg text-[#0a0a0a] bg-gradient-to-r from-white to-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] mt-4">
                  تسجيل الدخول / إنشاء حساب
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

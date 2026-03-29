'use client';

import Link from 'next/link';
import { Github, Twitter, Youtube, MessageCircle, Rocket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    browse: [
      { label: 'الأكثر شهرة', href: '/top' },
      { label: 'أحدث الإصدارات', href: '/search?sortBy=createdAt' },
      { label: 'مسلسلات', href: '/series' },
      { label: 'أفلام', href: '/movies' },
    ],
    genres: [
      { label: 'أكشن', href: '/search?genre=action' },
      { label: 'رومانسي', href: '/search?genre=romance' },
      { label: 'كوميديا', href: '/search?genre=comedy' },
      { label: 'دراما', href: '/search?genre=drama' },
    ],
    help: [
      { label: 'الأسئلة الشائعة', href: '/faq' },
      { label: 'اتصل بنا', href: '/contact' },
      { label: 'سياسة الخصوصية', href: '/privacy' },
      { label: 'شروط الخدمة', href: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: MessageCircle, href: '#', label: 'Discord' },
  ];

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 mt-auto relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 relative z-10" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-6 w-fit block">
              <Logo />
            </Link>
            <p className="text-gray-400 text-sm mb-8 max-w-sm leading-relaxed">
              وجهتك الأولى نحو مجرة الأنمي. استكشف آلاف الحلقات والأفلام بجودة فائقة مترجمة للعربية مع أسرع سيرفرات المشاهدة.
            </p>

            {/* Newsletter */}
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-200">اشترك في النشرة البريدية</p>
              <div className="flex gap-2 relative max-w-sm">
                <Input
                  type="email"
                  placeholder="البريد الإلكتروني..."
                  className="bg-white/5 border-white/10 focus:border-white text-right pl-24 h-12 rounded-full placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white"
                />
                <button className="absolute left-1 top-1 bottom-1 px-5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all">
                  اشترك
                </button>
              </div>
            </div>
          </div>

          {/* Browse Links */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 tracking-wide">تصفح الموقع</h3>
            <ul className="space-y-3">
              {footerLinks.browse.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white hover:translate-x-[-5px] transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres Links */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 tracking-wide">التصنيفات</h3>
            <ul className="space-y-3">
              {footerLinks.genres.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white hover:translate-x-[-5px] transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 tracking-wide">مركز الدعم</h3>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white hover:translate-x-[-5px] transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 text-sm font-medium">
            © {currentYear} WegoAnime. جميع الحقوق محفوظة.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
                aria-label={social.label}
                title={social.label}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

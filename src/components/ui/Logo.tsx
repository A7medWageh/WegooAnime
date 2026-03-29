import Link from 'next/link';
import Image from 'next/image';

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 group z-10 ${className}`}>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:border-[#00F0FF]/50 bg-[#0B0033]">
                <Image
                    src="/logo.png"
                    alt="Wego Anime Logo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 40px, 48px"
                    priority
                />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00F0FF] block whitespace-nowrap">
                Wego Anime
            </span>
        </div>
    );
}

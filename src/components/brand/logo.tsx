import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="lumen-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset=".55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lumen-g)" />
      {/* lamp shade + radiating waves */}
      <path d="M11 13h10l-2.2-5h-5.6L11 13Z" fill="#FFFFFF" />
      <path
        d="M10 18.5c3.6 3 8.4 3 12 0M7.5 21.5c5 4.4 12 4.4 17 0"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105" />
      <span className="font-display text-lg font-semibold tracking-tight">
        {siteConfig.shortName}
        <span className="text-gradient">.fm</span>
      </span>
    </Link>
  );
}

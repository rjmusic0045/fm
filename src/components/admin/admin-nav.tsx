"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disc3, IndianRupee, Inbox, Mic2, MessagesSquare, Music2, Podcast, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Songs", icon: Music2 },
  { href: "/admin/artists", label: "Artists", icon: Mic2 },
  { href: "/admin/albums", label: "Albums", icon: Disc3 },
  { href: "/admin/podcasts", label: "Podcasts", icon: Podcast },
  { href: "/admin/voices", label: "People & Voices", icon: MessagesSquare },
  { href: "/admin/submissions", label: "Review queue", icon: Inbox },
  { href: "/admin/users", label: "Users & plans", icon: Users },
  { href: "/admin/pricing", label: "Pricing", icon: IndianRupee },
];

export function AdminNav({ pendingReviews = 0 }: { pendingReviews?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
            {href === "/admin/submissions" && pendingReviews > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-4 text-white" aria-label={`${pendingReviews} pending`}>
                {pendingReviews}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

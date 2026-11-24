"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { UserMenu, accountLinks } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useIsSignedIn } from "@/components/providers/app-providers";

function AuthButtons({ signedIn, mobile = false }: { signedIn: boolean; mobile?: boolean }) {
  if (signedIn) {
    return (
      <>
        {mobile ? (
          <Button variant="glass" size="md" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut />
            Sign out
          </Button>
        ) : null}
        <Button asChild variant="gradient" size={mobile ? "md" : "sm"}>
          <Link href="/dashboard">
            <LayoutDashboard />
            Dashboard
          </Link>
        </Button>
        {/* Avatar menu: Settings, Admin (admins), Sign out */}
        {!mobile && <NotificationBell />}
        {!mobile && <UserMenu />}
      </>
    );
  }
  return (
    <>
      <Button asChild variant={mobile ? "glass" : "ghost"} size={mobile ? "md" : "sm"}>
        <Link href="/login">Sign In</Link>
      </Button>
      <Button asChild variant="gradient" size={mobile ? "md" : "sm"}>
        <Link href="/signup">Get Started</Link>
      </Button>
    </>
  );
}

function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { data } = useSession();
  // Dashboard already has its own button below.
  const links = accountLinks(data?.user?.role === "ADMIN").filter((l) => l.href !== "/dashboard");
  return (
    <ul className="mt-2 border-t border-foreground/10 pt-2">
      {links.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const signedIn = useIsSignedIn();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  // Close the mobile menu on navigation and on Escape.
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]) && !href.startsWith("/#"));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6">
      <motion.nav
        aria-label="Main"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl px-4 transition-all duration-300 md:px-5",
          scrolled ? "glass-strong" : "border border-transparent",
        )}
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex" onMouseLeave={() => setHovered(null)}>
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onMouseEnter={() => setHovered(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive(item.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {hovered === item.href && (
                  <motion.span
                    layoutId="nav-hover"
                    className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.07]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <AuthButtons signedIn={signedIn} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass-strong mx-auto mt-2 max-w-6xl rounded-2xl p-3 md:hidden"
          >
            <ul className="flex flex-col">
              {siteConfig.nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-base font-medium text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            {signedIn && <MobileAccountLinks onNavigate={() => setOpen(false)} />}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-foreground/10 pt-3">
              <AuthButtons signedIn={signedIn} mobile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

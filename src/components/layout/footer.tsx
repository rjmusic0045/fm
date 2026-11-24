import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";

function SocialIcon({ label, path }: { label: string; path: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid size-9 place-items-center rounded-full border border-foreground/10 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:text-foreground hover:shadow-glow"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    </a>
  );
}

const socials = [
  {
    label: "Facebook",
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z",
  },
  {
    label: "Instagram",
    path: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3.1 0-4.1.06C4.6 2.2 2.2 4.6 2.06 7.9 2 8.9 2 9.3 2 12s0 3.1.06 4.1c.15 3.3 2.55 5.7 5.84 5.84 1 .06 1.4.06 4.1.06s3.1 0 4.1-.06c3.3-.15 5.7-2.55 5.84-5.84.06-1 .06-1.4.06-4.1s0-3.1-.06-4.1C21.8 4.6 19.4 2.2 16.1 2.06 15.1 2 14.7 2 12 2Zm0 1.8c2.67 0 3 0 4.04.06 2.32.1 3.99 1.77 4.1 4.1.05 1.04.06 1.37.06 4.04s0 3-.06 4.04c-.11 2.33-1.78 4-4.1 4.1-1.04.05-1.37.06-4.04.06s-3 0-4.04-.06c-2.33-.1-4-1.78-4.1-4.1C3.81 15 3.8 14.67 3.8 12s0-3 .06-4.04c.1-2.33 1.77-4 4.1-4.1C9 3.81 9.33 3.8 12 3.8Z",
  },
  {
    label: "X",
    path: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.46 21H2.39l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z",
  },
];

export function Footer() {
  return (
    <footer className="theme-dark relative mt-24 bg-[#0B0B16] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-pink/50 to-transparent"
      />
      <div className="container grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{siteConfig.description}</p>
          <div className="flex gap-2">
            {socials.map((s) => (
              <SocialIcon key={s.label} {...s} />
            ))}
          </div>
        </div>

        {Object.entries(siteConfig.footer).map(([heading, links]) => (
          <nav key={heading} aria-label={heading}>
            <h2 className="mb-4 font-sans text-sm font-semibold text-foreground">{heading}</h2>
            <ul className="space-y-2.5">
              {links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container flex flex-col items-center justify-between gap-2 border-t border-foreground/[0.06] py-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <p>Made for night owls and early birds.</p>
      </div>
    </footer>
  );
}

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MiniPlayer, PlayerSpacer } from "@/components/player/mini-player";

/** Signed-in user pages (onboarding, settings): same chrome as the public site. */
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="relative pt-24">
        {children}
      </main>
      <Footer />
      <PlayerSpacer />
      <MiniPlayer />
    </>
  );
}

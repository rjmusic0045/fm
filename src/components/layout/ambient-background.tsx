/**
 * Fixed decorative backdrop for the light theme: soft colour glows at the top
 * of the canvas plus a faint dot grid that fades out. Pure CSS gradients (no
 * blur filters), so it costs nothing to scroll.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(45% 60% at 12% 0%, rgba(99,102,241,0.16) 0%, transparent 70%)," +
            "radial-gradient(40% 55% at 88% 4%, rgba(236,72,153,0.10) 0%, transparent 70%)," +
            "radial-gradient(60% 50% at 50% 0%, rgba(167,139,250,0.10) 0%, transparent 75%)",
        }}
      />
      <div
        className="bg-dots absolute inset-x-0 top-0 h-[560px]"
        style={{
          maskImage: "radial-gradient(70% 100% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(70% 100% at 50% 0%, black 0%, transparent 75%)",
        }}
      />
    </div>
  );
}

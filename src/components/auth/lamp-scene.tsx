"use client";

import * as React from "react";
import Link from "next/link";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { playBulbHum, playSwitchClick } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------- */
/* Geometry (px). The floor lamp SVG is drawn at its native 260×580 size.     */
/* ------------------------------------------------------------------------- */
const LAMP_W = 260;
const LAMP_H = 580;
const SHADE_CX = 130; // shade centre x
const SHADE_BOTTOM = 160; // bottom rim of the shade (where light spills down)
const FLOOR_Y = 556;
const CORD_X = 206; // pull cord hangs from the right of the shade rim
const CORD_TOP = SHADE_BOTTOM - 2;
const CORD_REST = 96; // resting cord length
const PULL_THRESHOLD = 70; // drag distance that toggles the light
const MAX_PULL = 120;
const HINT_KEY = "lumen:lamp-pulled";

/* ------------------------------------------------------------------------- */

const SHADE_PATH = `M82 34 L178 34 L232 ${SHADE_BOTTOM} L28 ${SHADE_BOTTOM} Z`;

function FloorLampSvg({ intensity }: { intensity: MotionValue<number> }) {
  const glowR = useTransform(intensity, [0, 1], [8, 60]);
  const shadeLit = useTransform(intensity, [0, 1], [0, 0.92]);
  return (
    <svg width={LAMP_W} height={LAMP_H} viewBox={`0 0 ${LAMP_W} ${LAMP_H}`} className="block overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="fl-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1d1b24" />
          <stop offset="0.45" stopColor="#2c2935" />
          <stop offset="1" stopColor="#16141c" />
        </linearGradient>
        <linearGradient id="fl-shade-lit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9C2" />
          <stop offset="1" stopColor="#F8B860" />
        </linearGradient>
        <linearGradient id="fl-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a3946" />
          <stop offset="0.5" stopColor="#7a7889" />
          <stop offset="1" stopColor="#2a2934" />
        </linearGradient>
        <radialGradient id="fl-bulb-glow">
          <stop offset="0" stopColor="#FFF6DD" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#FFC56B" stopOpacity="0.5" />
          <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fl-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD08A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFD08A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* light pool on the floor */}
      <motion.ellipse cx={SHADE_CX} cy={FLOOR_Y} rx="230" ry="26" fill="url(#fl-pool)" style={{ opacity: intensity }} />
      {/* contact shadow */}
      <ellipse cx={SHADE_CX} cy={FLOOR_Y + 2} rx="86" ry="9" fill="#000" opacity="0.6" />

      {/* base */}
      <path d={`M60 ${FLOOR_Y - 2} Q130 ${FLOOR_Y - 34} 200 ${FLOOR_Y - 2} Z`} fill="url(#fl-metal)" />
      <ellipse cx={SHADE_CX} cy={FLOOR_Y - 2} rx="70" ry="7" fill="#22212b" stroke="rgba(255,255,255,0.08)" />

      {/* pole + collar */}
      <rect x={SHADE_CX - 3} y={SHADE_BOTTOM - 40} width="6" height={FLOOR_Y - SHADE_BOTTOM + 20} rx="3" fill="url(#fl-metal)" />
      <rect x={SHADE_CX - 6} y="330" width="12" height="14" rx="4" fill="url(#fl-metal)" />

      {/* bulb + glow spilling out under the shade */}
      <motion.circle cx={SHADE_CX} cy={SHADE_BOTTOM - 14} r={glowR} fill="url(#fl-bulb-glow)" style={{ opacity: intensity }} />
      <circle cx={SHADE_CX} cy={SHADE_BOTTOM - 16} r="11" fill="#2a2a35" />
      <motion.circle cx={SHADE_CX} cy={SHADE_BOTTOM - 16} r="11" fill="#FFF4D6" style={{ opacity: intensity }} />

      {/* drum shade: dark fabric, glowing warm when lit */}
      <path d={SHADE_PATH} fill="url(#fl-shade)" stroke="rgba(255,255,255,0.1)" />
      <motion.path d={SHADE_PATH} fill="url(#fl-shade-lit)" style={{ opacity: shadeLit }} />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={82 + 96 * t} y1="36" x2={28 + 204 * t} y2={SHADE_BOTTOM - 2} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      ))}
      <ellipse cx={SHADE_CX} cy="34" rx="48" ry="4" fill="#15131a" stroke="rgba(255,255,255,0.1)" />
      <ellipse cx={SHADE_CX} cy={SHADE_BOTTOM} rx="102" ry="7" fill="#0c0b10" stroke="rgba(255,255,255,0.1)" />
      <motion.ellipse cx={SHADE_CX} cy={SHADE_BOTTOM} rx="100" ry="6" fill="#FFE2AE" style={{ opacity: intensity }} />
    </svg>
  );
}

/* ------------------------------------------------------------------------- */

interface PullCordProps {
  lit: boolean;
  onPull: (source: "drag" | "keyboard") => void;
  showHint: boolean;
}

function PullCord({ lit, onPull, showHint }: PullCordProps) {
  const reduce = useReducedMotion();
  const y = useMotionValue(0);
  const cordHeight = useTransform(y, (v) => CORD_REST + v);
  const [armed, setArmed] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const draggedRef = React.useRef(false);
  const armedRef = React.useRef(false);

  const springBack = () =>
    animate(y, 0, reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 9, mass: 0.6 });

  const onDrag = (_: unknown, info: PanInfo) => {
    const isArmed = info.offset.y >= PULL_THRESHOLD;
    if (isArmed !== armedRef.current) {
      armedRef.current = isArmed;
      setArmed(isArmed);
      if (isArmed && "vibrate" in navigator) navigator.vibrate?.(8);
    }
  };

  const onDragEnd = () => {
    setDragging(false);
    // The browser may fire a click right after pointerup; ignore that one only.
    window.setTimeout(() => (draggedRef.current = false), 60);
    if (armedRef.current) onPull("drag");
    armedRef.current = false;
    setArmed(false);
    springBack();
  };

  /** Click / Enter / Space: play a short pull animation, then toggle. */
  const keyboardPull = async () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (reduce) {
      onPull("keyboard");
      return;
    }
    await animate(y, PULL_THRESHOLD + 12, { duration: 0.16, ease: "easeIn" });
    onPull("keyboard");
    springBack();
  };

  return (
    <div className="pointer-events-none absolute" style={{ left: CORD_X, top: CORD_TOP }}>
      {/* the thread */}
      <motion.div
        aria-hidden
        className="absolute left-0 top-0 w-[2px] -translate-x-1/2 rounded-full"
        style={{
          height: cordHeight,
          background: lit
            ? "linear-gradient(to bottom, rgba(255,214,150,0.85), rgba(255,214,150,0.55))"
            : "linear-gradient(to bottom, rgba(170,170,200,0.45), rgba(170,170,200,0.3))",
        }}
      />

      {/* the bead (44px hit target, 20px visual) */}
      <motion.button
        type="button"
        drag="y"
        dragConstraints={{ top: 0, bottom: MAX_PULL }}
        dragElastic={{ top: 0.05, bottom: 0.15 }}
        dragMomentum={false}
        onDragStart={() => {
          draggedRef.current = true;
          setDragging(true);
        }}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onClick={keyboardPull}
        style={{ y, top: CORD_REST - 12, left: -22 }}
        whileHover={reduce ? undefined : { scale: 1.12 }}
        className="pointer-events-auto absolute grid size-11 cursor-grab touch-none place-items-center rounded-full active:cursor-grabbing"
        aria-label={lit ? "Pull the lamp cord to turn the light off and hide the sign-in form" : "Pull the lamp cord to turn the light on and show the sign-in form"}
        aria-pressed={lit}
      >
        <span
          aria-hidden
          className={cn(
            "block size-5 rounded-full transition-all duration-200",
            lit
              ? "bg-gradient-to-b from-amber-100 to-amber-400 shadow-[0_0_16px_rgba(255,190,90,0.8)]"
              : "bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-[0_0_14px_rgba(200,200,255,0.25)]",
            !lit && !dragging && "animate-[bead-glow_2.4s_ease-in-out_infinite]",
            armed && "scale-125 from-amber-50 to-amber-300 shadow-[0_0_26px_rgba(255,190,90,1)]",
          )}
        />
      </motion.button>

      {/* first-time hint */}
      <AnimatePresence>
        {showHint && !dragging && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { delay: 0, duration: 0.15 } }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute whitespace-nowrap"
            style={{ top: CORD_REST - 2, left: 28 }}
          >
            <motion.span
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.04] px-3 py-1 text-sm font-medium text-zinc-300 backdrop-blur"
              animate={reduce ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <span aria-hidden>↓</span> Pull the cord
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

const dust = Array.from({ length: 12 }, (_, i) => ({
  left: 34 + ((i * 37) % 32),
  top: 6 + ((i * 53) % 80),
  size: 1 + (i % 3),
  delay: -((i * 0.9) % 6),
  duration: 6 + (i % 5),
}));

/** Light falling from the shade to the floor, plus the warm wash over the room. */
function LampLight({ intensity }: { intensity: MotionValue<number> }) {
  const coneW = 640;
  const coneH = FLOOR_Y - SHADE_BOTTOM;
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: intensity }}>
      {/* room wash centred on the shade: reaches across to the form */}
      <div
        className="absolute rounded-full"
        style={{
          width: 2400,
          height: 2400,
          left: SHADE_CX - 1200,
          top: 100 - 1200,
          background:
            "radial-gradient(circle, rgba(255,205,140,0.22) 0%, rgba(255,185,110,0.10) 22%, rgba(255,170,90,0.04) 40%, transparent 58%)",
        }}
      />
      {/* glow above the open top of the shade */}
      <div
        className="absolute blur-2xl"
        style={{
          width: 220,
          height: 160,
          left: SHADE_CX - 110,
          top: -120,
          background: "radial-gradient(50% 60% at 50% 100%, rgba(255,220,160,0.35), transparent 70%)",
        }}
      />
      {/* downward cone */}
      <div className="absolute" style={{ width: coneW, height: coneH, left: SHADE_CX - coneW / 2, top: SHADE_BOTTOM }}>
        <div
          className="absolute inset-0 blur-xl"
          style={{
            clipPath: "polygon(calc(50% - 100px) 0, calc(50% + 100px) 0, 100% 100%, 0 100%)",
            background:
              "linear-gradient(to bottom, rgba(255,214,150,0.38) 0%, rgba(255,190,110,0.14) 55%, rgba(255,170,90,0.06) 100%)",
          }}
        />
        {dust.map((d, i) => (
          <span
            key={i}
            className="absolute animate-float rounded-full bg-amber-100/50"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------------- */

export interface LampSceneProps {
  children: React.ReactNode;
  /** Start with the lamp already on (used by the reset/forgot pages). */
  initialLit?: boolean;
  /** Accessible page title (visually hidden). */
  title: string;
  /** Called after every toggle. */
  onToggle?: (lit: boolean) => void;
  className?: string;
}

/**
 * The signature auth scene: a dark room with a standing floor lamp on the left.
 * Pull its cord (drag down, or click/Enter) to switch the light on and slide
 * the form in on the right.
 */
export function LampScene({ children, initialLit = false, title, onToggle, className }: LampSceneProps) {
  const reduce = useReducedMotion();
  const [lit, setLit] = React.useState(initialLit);
  const [showHint, setShowHint] = React.useState(false);
  const focusOnRevealRef = React.useRef(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const intensity = useMotionValue(initialLit ? 1 : 0);
  const lampFilter = useTransform(intensity, [0, 1], ["brightness(0.75)", "brightness(1.05)"]);
  const floorGlow = useTransform(intensity, [0, 1], [0.15, 1]);

  React.useEffect(() => {
    if (initialLit) return;
    try {
      setShowHint(window.localStorage.getItem(HINT_KEY) !== "1");
    } catch {
      setShowHint(true);
    }
  }, [initialLit]);

  const setLight = React.useCallback(
    (next: boolean, opts: { focus?: boolean; silent?: boolean } = {}) => {
      setLit(next);
      onToggle?.(next);
      focusOnRevealRef.current = !!opts.focus && next;

      if (!opts.silent) {
        playSwitchClick(next);
        if (next) playBulbHum();
      }

      if (reduce) {
        intensity.set(next ? 1 : 0);
      } else if (next) {
        // warm-up flicker
        animate(intensity, [0, 0.85, 0.1, 0.95, 0.4, 1], {
          duration: 0.75,
          times: [0, 0.08, 0.18, 0.34, 0.5, 1],
          ease: "easeOut",
        });
      } else {
        animate(intensity, 0, { duration: 0.22, ease: "easeIn" });
      }

      setShowHint(false);
      try {
        window.localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* storage unavailable (private mode): ignore */
      }
    },
    [intensity, reduce, onToggle],
  );

  const handlePull = (source: "drag" | "keyboard") => setLight(!lit, { focus: source === "keyboard" });

  const focusFirstField = () => {
    if (!focusOnRevealRef.current) return;
    focusOnRevealRef.current = false;
    const card = cardRef.current;
    (card?.querySelector<HTMLElement>("input:not([type=hidden])") ?? card?.querySelector<HTMLElement>("button"))?.focus();
  };

  return (
    <div className={cn("relative min-h-dvh overflow-hidden bg-[#060509] text-foreground", className)}>
      <h1 className="sr-only">{title}</h1>
      <p className="sr-only" id="lamp-instructions">
        The room is dark. Pull the cord on the floor lamp, or press the cord button, to switch on the light and
        reveal the form. A &quot;Show login&quot; button is also available.
      </p>

      {/* --- floor ----------------------------------------------------------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[16vh] bg-gradient-to-b from-[#0d0b10] to-[#09080c] lg:block"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[16vh] hidden h-px bg-gradient-to-r from-amber-200/30 via-amber-200/10 to-transparent lg:block"
        style={{ opacity: floorGlow }}
      />

      {/* --- top bar ------------------------------------------------------- */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 transition-opacity duration-700 md:p-6",
          lit ? "opacity-100" : "opacity-50 hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <Logo className="max-sm:[&>span]:hidden" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="max-sm:sr-only">Back to home</span>
        </Link>
      </div>

      <div className="relative grid min-h-dvh lg:grid-cols-2">
        {/* --- left: the standing lamp, feet on the floor ------------------- */}
        <div className="relative flex items-end justify-center pt-20 lg:pb-[calc(16vh-24px)] lg:pt-0">
          {/* Full size on desktop; half size above the form on mobile. */}
          <div className="relative h-[290px] w-[130px] lg:h-[580px] lg:w-[260px]">
            <div className="absolute left-0 top-0 origin-top-left scale-50 lg:scale-100" style={{ width: LAMP_W, height: LAMP_H }}>
              <LampLight intensity={intensity} />
              <motion.div className="relative z-10" style={{ filter: lampFilter }}>
                <FloorLampSvg intensity={intensity} />
              </motion.div>
              <div className="absolute inset-0 z-20">
                <PullCord lit={lit} onPull={handlePull} showHint={showHint} />
              </div>
            </div>
          </div>
        </div>

        {/* --- right: the form, revealed by the light ------------------------ */}
        <div className="relative z-10 flex items-start justify-center px-4 pb-16 pt-8 lg:items-center lg:justify-start lg:px-12 lg:py-24 xl:px-20">
          <AnimatePresence mode="wait">
            {lit ? (
              <motion.div
                key="card"
                ref={cardRef}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 48, filter: "blur(8px)" }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, filter: "blur(4px)", transition: { duration: 0.2 } }}
                transition={{ delay: initialLit ? 0 : 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={focusFirstField}
                className="w-full max-w-md"
              >
                {children}
              </motion.div>
            ) : (
              <motion.div
                key="dark"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ delay: reduce ? 0 : 0.6, duration: 0.8 }}
                className="flex w-full max-w-md flex-col items-center gap-4 text-center lg:items-start lg:text-left"
              >
                <p className="font-display text-3xl font-semibold text-zinc-500 sm:text-4xl">It&apos;s a little dark in here.</p>
                <p className="text-zinc-500">
                  <span className="hidden lg:inline">&larr; </span>
                  <span className="lg:hidden">&uarr; </span>
                  Pull the lamp&apos;s cord to switch on the light and sign in.
                </p>
                <button
                  type="button"
                  onClick={() => setLight(true, { focus: true, silent: !!reduce })}
                  aria-describedby="lamp-instructions"
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition-colors",
                    reduce
                      ? "border border-foreground/20 bg-foreground/5 text-foreground hover:bg-foreground/10"
                      : "text-zinc-500 underline underline-offset-4 hover:text-zinc-300 lg:-ml-4",
                  )}
                >
                  Show login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  src: string;
  title: string;
  categoria: string;
  description: string;
  pos: number;
};

type Props = {
  slides: Slide[];
  urls: Record<string, string[]>;
  onSelect: (slide: Slide, src: string) => void;
  autoplayMs?: number;
  pairMode?: boolean;
};

export function StackedCarousel({
  slides,
  urls,
  onSelect,
  autoplayMs = 4500,
  pairMode = false,
}: Props) {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const total = slides.length;
  const step = pairMode ? 2 : 1;

  // Track viewport for perf-aware rendering (less blur, tighter spread on mobile)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Resolve src per slide once
  const resolved = useMemo(
    () => slides.map((s) => urls[s.categoria]?.[s.pos] ?? s.src),
    [slides, urls]
  );

  // Preload neighbors (2 on each side) for smoother transitions
  useEffect(() => {
    if (!total) return;
    const window_ = 2;
    for (let d = -window_; d <= window_; d++) {
      const idx = ((active + d) % total + total) % total;
      if (ready[idx]) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = resolved[idx];
      img.onload = () => setReady((r) => (r[idx] ? r : { ...r, [idx]: true }));
    }
  }, [active, total, resolved, ready]);

  useEffect(() => {
    if (hover || total < step) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((i) => (i + step) % total), autoplayMs);
    return () => clearInterval(t);
  }, [hover, total, autoplayMs, step]);

  const go = (dir: 1 | -1) => setActive((i) => (i + dir * step + total) % total);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div
      className="relative mx-auto w-full max-w-5xl select-none pt-2 sm:pt-4"
      style={{ height: "clamp(340px, 56vw, 560px)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 flex items-center justify-center [perspective:1600px]">
        {slides.map((slide, i) => {
          const leftIndex = active;
          const rightIndex = (active + 1) % total;
          const isLeft = pairMode && i === leftIndex;
          const isRight = pairMode && i === rightIndex;
          const isVisiblePair = isLeft || isRight;

          let offset: number;
          if (isLeft) {
            offset = -1;
          } else if (isRight) {
            offset = 1;
          } else {
            let d = i - active;
            if (d > total / 2) d -= total;
            if (d <= -total / 2) d += total;
            if (d > 0) {
              offset = d + 0.35;
            } else {
              offset = d - 0.35;
            }
          }

          const abs = Math.abs(offset);
          // Only render nearby slides for perf; hide the rest completely
          const inRange = abs <= (isMobile ? 2 : 3);
          const spread = isVisiblePair
            ? isMobile ? 32 : 36
            : isMobile ? 36 : 42;
          const translateX = offset * spread;
          const scale = isVisiblePair ? 1 : Math.max(0.72, 1 - abs * 0.06);
          const opacity = isVisiblePair ? 1 : abs > 3 ? 0 : Math.max(0.45, 1 - abs * 0.18);
          const rotateY = isVisiblePair ? 0 : offset * -3;
          const zIndex = isVisiblePair ? 50 : 50 - Math.round(abs);
          // Skip blur on mobile — expensive on GPU
          const blur = isVisiblePair || isMobile ? 0 : Math.min(1.5, abs * 0.4);
          const src = resolved[i];
          const isCenter = i === active || isVisiblePair;

          return (
            <button
              type="button"
              key={i}
              onClick={() => onSelect(slide, src)}
              aria-label={`Ver ${slide.title}`}
              aria-hidden={!inRange}
              tabIndex={inRange ? 0 : -1}
              className="group absolute top-1/2 left-1/2 h-[74%] w-[clamp(220px,34vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden border-2 border-sky-400/70 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.65),0_0_28px_rgba(56,155,255,0.35)] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:border-sky-300 hover:shadow-[0_25px_65px_-8px_rgba(0,0,0,0.75),0_0_50px_rgba(56,189,248,0.75),0_0_0_1px_rgba(56,189,248,0.55)]"
              style={{
                transform: `translate3d(-50%, -50%, 0) translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                opacity: inRange ? opacity : 0,
                zIndex,
                filter: blur ? `blur(${blur}px)` : undefined,
                pointerEvents: inRange && abs <= 4 ? "auto" : "none",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                visibility: inRange ? "visible" : "hidden",
              }}
            >
              <img
                src={src}
                alt={slide.title}
                crossOrigin="anonymous"
                loading={isCenter ? "eager" : "lazy"}
                // @ts-expect-error - React 19 accepts lowercase, cast for older types
                fetchpriority={isCenter ? "high" : "low"}
                decoding="async"
                draggable={false}
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 34vw, 360px"
                onLoad={() => setReady((r) => (r[i] ? r : { ...r, [i]: true }))}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                style={{ opacity: ready[i] ? 1 : 0, transition: "opacity 400ms ease" }}
              />
              {!ready[i] && (
                <div className="absolute inset-0 bg-gradient-to-br from-sky-950/40 via-background/50 to-background animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-left">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#d8bf85]/90 mb-1">
                  Destaque
                </p>
                <h3 className="font-display text-lg sm:text-2xl text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                  {slide.title}
                </h3>
              </div>
              {isVisiblePair && (
                <div className="absolute inset-0 ring-1 ring-inset ring-sky-300/40 rounded-2xl pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Anterior"
        className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-[60] h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center bg-background/60 backdrop-blur border border-sky-400/50 text-sky-200 hover:text-sky-100 hover:border-sky-300 hover:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Próximo"
        className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-[60] h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center bg-background/60 backdrop-blur border border-sky-400/50 text-sky-200 hover:text-sky-100 hover:border-sky-300 hover:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="absolute bottom-2 left-0 right-0 z-[60] flex justify-center gap-2 px-4 flex-wrap">
        {Array.from({ length: pairMode ? Math.ceil(total / step) : total }).map((_, i) => {
          const idx = pairMode ? i * step : i;
          const isActive = active === idx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Ir para destaque ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-8 bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                  : "w-2 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function StackedCarousel({ slides, urls, onSelect, autoplayMs = 4500 }: Props) {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dragDx, setDragDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const total = slides.length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const resolved = useMemo(
    () => slides.map((s) => urls[s.categoria]?.[s.pos] ?? s.src),
    [slides, urls],
  );

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + total) % total),
    [total],
  );

  // Preload neighbours
  useEffect(() => {
    if (!total) return;
    for (let d = -2; d <= 2; d++) {
      const idx = ((active + d) % total + total) % total;
      if (ready[idx]) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = resolved[idx];
      img.onload = () => setReady((r) => (r[idx] ? r : { ...r, [idx]: true }));
    }
  }, [active, total, resolved, ready]);

  useEffect(() => {
    if (hover || dragging || total < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const t = setInterval(() => setActive((i) => (i + 1) % total), autoplayMs);
    return () => clearInterval(t);
  }, [hover, dragging, total, autoplayMs]);

  // Keyboard
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!total) return;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        go(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        go(1);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(total - 1);
        break;
      case "PageUp":
        e.preventDefault();
        setActive((i) => (i - 2 + total * 2) % total);
        break;
      case "PageDown":
        e.preventDefault();
        setActive((i) => (i + 2) % total);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect(slides[active], resolved[active]);
        break;
      default:
        break;
    }
  };

  // Mouse wheel navigation (horizontal / shift+wheel)
  const wheelLock = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!dx) return;
    const now = Date.now();
    if (now - wheelLock.current < 320) return;
    wheelLock.current = now;
    go(dx > 0 ? 1 : -1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    setDragDx(dx);
  };
  const endDrag = () => {
    if (drag.current) {
      const dx = dragDx;
      const threshold = 60;
      if (dx <= -threshold) go(1);
      else if (dx >= threshold) go(-1);
    }
    drag.current = null;
    setDragDx(0);
    setDragging(false);
  };

  // Fractional offset while dragging for a live coverflow feel
  const cardW = isMobile ? 240 : 380;
  const dragOffset = dragging ? -dragDx / cardW : 0;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Coleção em destaque"
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => dragging && endDrag()}
      className="relative mx-auto w-full max-w-6xl select-none overflow-hidden px-2 outline-none touch-pan-y focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-0 sm:px-4"
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      {/* Stage */}
      <div
        className="relative mx-auto flex w-full items-center justify-center overflow-hidden"
        style={{
          height: isMobile ? "clamp(260px, 74vw, 380px)" : "clamp(320px, 52vw, 540px)",
          perspective: isMobile ? "1100px" : "1600px",
        }}
      >
        {slides.map((slide, i) => {
          let d = i - active;
          if (d > total / 2) d -= total;
          if (d <= -total / 2) d += total;
          const offset = d + dragOffset;
          const abs = Math.abs(offset);
          const inRange = abs <= (isMobile ? 2.2 : 3.6);

          const spread = isMobile ? 40 : 52;
          const translateX = offset * spread;
          const scale = Math.max(0.62, 1 - abs * 0.13);
          const opacity = abs < 0.5 ? 1 : Math.max(0.15, 1 - abs * 0.18);
          const rotateY = Math.max(-26, Math.min(26, offset * -14));
          const translateZ = -abs * (isMobile ? 90 : 140);
          const zIndex = 100 - Math.round(abs * 10);
          const blur = isMobile ? 0 : Math.min(2.5, Math.max(0, abs - 0.5) * 1.2);
          const isActive = abs < 0.5;
          const src = resolved[i];

          return (
            <button
              type="button"
              key={i}
              onClick={() => {
                if (drag.current?.moved) return;
                if (!isActive) {
                  setActive(i);
                  return;
                }
                onSelect(slide, src);
              }}
              aria-label={`Ver ${slide.title}`}
              aria-hidden={!inRange}
              tabIndex={isActive ? 0 : -1}
              className="group absolute left-1/2 top-1/2 h-[76%] w-[clamp(180px,60vw,380px)] overflow-hidden rounded-2xl border border-[#d8bf85]/30 bg-background shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)] outline-none transition-[transform,opacity,filter] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform focus-visible:ring-2 focus-visible:ring-sky-300 sm:h-[78%] sm:w-[clamp(210px,32vw,380px)] sm:rounded-3xl"
              style={{
                transform: `translate3d(-50%, -50%, 0) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity: inRange ? opacity : 0,
                zIndex,
                filter: blur ? `blur(${blur}px)` : undefined,
                transitionDuration: dragging ? "0ms" : undefined,
                pointerEvents: inRange ? "auto" : "none",
                visibility: inRange ? "visible" : "hidden",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                boxShadow: isActive
                  ? "0 40px 90px -25px rgba(0,0,0,0.9), 0 0 44px rgba(56,189,248,0.35)"
                  : undefined,
              }}
            >
              <img
                src={src}
                alt={slide.title}
                crossOrigin="anonymous"
                loading={isActive ? "eager" : "lazy"}
                // @ts-expect-error lowercase attr
                fetchpriority={isActive ? "high" : "low"}
                decoding="async"
                draggable={false}
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 34vw, 380px"
                onLoad={() => setReady((r) => (r[i] ? r : { ...r, [i]: true }))}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                style={{ opacity: ready[i] ? 1 : 0, transition: "opacity 400ms ease" }}
              />
              {!ready[i] && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sky-950/40 via-background/50 to-background" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/15 to-transparent transition-opacity duration-500"
                style={{ opacity: isActive ? 1 : 0.85 }}
              />
              {/* Suave moldura azul marinho no hover */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#1e3a8a] opacity-0 shadow-[inset_0_0_18px_rgba(30,58,138,0.55),0_0_22px_rgba(30,58,138,0.5)] transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:rounded-3xl"
              />
              <div className="absolute inset-x-4 bottom-4 text-left sm:inset-x-5 sm:bottom-5">
                <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-[#d8bf85]/90">
                  Destaque
                </p>
                <h3 className="font-display text-lg text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-2xl">
                  {slide.title}
                </h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-4 sm:mt-6 sm:gap-6">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Anterior"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8bf85]/40 bg-background/60 text-[#d8bf85] backdrop-blur transition-all hover:border-[#d8bf85] hover:shadow-[0_0_18px_rgba(216,191,133,0.45)] sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ir para destaque ${i + 1}`}
              aria-current={active === i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === i
                  ? "w-8 bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                  : "w-2 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próximo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8bf85]/40 bg-background/60 text-[#d8bf85] backdrop-blur transition-all hover:border-[#d8bf85] hover:shadow-[0_0_18px_rgba(216,191,133,0.45)] sm:h-11 sm:w-11"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

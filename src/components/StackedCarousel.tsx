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
    // Only respond to horizontal scrolling or shift+vertical scrolling for sliding
    // Standard vertical scrolling should allow normal page navigation
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (Math.abs(dx) < 10) return; // ignore jitter
    
    const now = Date.now();
    if (now - wheelLock.current < 450) return;
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
        {/* Discreet blue glow behind the central artwork */}
        <div className="gallery-glow" />
        {slides.map((slide, i) => {
          let d = i - active;
          if (d > total / 2) d -= total;
          if (d <= -total / 2) d += total;
          const offset = d + dragOffset;
          const abs = Math.abs(offset);
          
          // Optimization: only render slides that are close to the center
          const inRange = abs <= (isMobile ? 2.5 : 4);
          if (!inRange) return null;

          const spread = isMobile ? 42 : 54;
          const translateX = offset * spread;
          const scale = Math.max(0.6, 1 - abs * 0.12);
          const opacity = abs < 0.5 ? 1 : Math.max(0.1, 1 - abs * 0.2);
          const rotateY = Math.max(-25, Math.min(25, offset * -12));
          const translateZ = -abs * (isMobile ? 80 : 130);
          const zIndex = 100 - Math.round(abs * 10);
          const blur = isMobile ? 0 : Math.min(2, Math.max(0, abs - 0.6) * 1.5);
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
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              className="group absolute left-1/2 top-1/2 h-[76%] w-[clamp(180px,60vw,380px)] overflow-hidden rounded-2xl border border-white/10 bg-background shadow-[0_40px_90px_-20px_rgba(0,0,0,0.95)] outline-none transition-[transform,opacity,filter] duration-[800ms] cubic-bezier(0.2, 0.8, 0.2, 1) will-change-transform focus-visible:ring-2 focus-visible:ring-sky-400/50 sm:h-[78%] sm:w-[clamp(210px,32vw,380px)] sm:rounded-3xl"
              style={{
                transform: `translate3d(-50%, -50%, 0) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity: inRange ? opacity : 0,
                zIndex,
                filter: blur ? `blur(${blur}px)` : undefined,
                transitionDuration: dragging ? "0ms" : undefined,
                pointerEvents: "auto",
                visibility: "visible",

                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                boxShadow: isActive
                  ? `0 50px 100px -25px rgba(0,0,0,1), 0 0 60px rgba(56,155,255,0.4), 0 0 140px rgba(56,155,255,0.15)`
                  : undefined,
              }}
            >
              <img
                src={src}
                alt={slide.title}
                crossOrigin="anonymous"
                loading={isActive ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={isActive ? "high" : "low"}
                draggable={false}
                sizes="(max-width: 420px) 78vw, (max-width: 640px) 70vw, (max-width: 1024px) 34vw, 380px"

                onLoad={() => setReady((r) => (r[i] ? r : { ...r, [i]: true }))}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                style={{ opacity: ready[i] ? 1 : 0, transition: "opacity 400ms ease" }}
              />
              {!ready[i] && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sky-950/40 via-background/50 to-background" />
              )}
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8bf85]/40 bg-background/60 text-[#d8bf85] backdrop-blur transition-all hover:border-[#d8bf85] hover:text-[#f5e6b8] hover:shadow-[0_0_18px_rgba(216,191,133,0.45)] sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 max-w-[55vw] items-center justify-start gap-2 overflow-x-auto px-1 sm:max-w-none sm:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              data-no-touch-target
              onClick={() => setActive(i)}
              aria-label={`Ir para destaque ${i + 1}`}
              aria-current={active === i}
              className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${
                active === i
                  ? "w-8 bg-[#d8bf85] shadow-[0_0_10px_rgba(216,191,133,0.8)]"
                  : "w-2 bg-[#d8bf85]/30 hover:bg-[#d8bf85]/60"
              }`}
            />
          ))}
        </div>


        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próximo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8bf85]/40 bg-background/60 text-[#d8bf85] backdrop-blur transition-all hover:border-[#d8bf85] hover:text-[#f5e6b8] hover:shadow-[0_0_18px_rgba(216,191,133,0.45)] sm:h-11 sm:w-11"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

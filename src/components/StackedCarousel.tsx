import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  src: string;
  title: string;
  categoria: string;
  description: string;
};

type Props = {
  slides: Slide[];
  urls: Record<string, string>;
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
  const total = slides.length;
  const step = pairMode ? 2 : 1;

  useEffect(() => {
    if (hover || total < step) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((i) => (i + step) % total), autoplayMs);
    return () => clearInterval(t);
  }, [hover, total, autoplayMs, step]);

  const go = (dir: 1 | -1) => setActive((i) => (i + dir * step + total) % total);

  return (
    <div
      className="relative mx-auto w-full max-w-5xl select-none pt-2 sm:pt-4"
      style={{ height: "clamp(380px, 58vw, 560px)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
              offset = d;
            } else {
              offset = d - 1;
            }
          }

          const abs = Math.abs(offset);
          const spread = isVisiblePair ? 52 : 76; // % of card width
          const translateX = offset * spread;
          const scale = isVisiblePair ? 1 : Math.max(0.55, 1 - abs * 0.15);
          const opacity = isVisiblePair ? 1 : abs > 3 ? 0 : Math.max(0.35, 1 - abs * 0.25);
          const rotateY = isVisiblePair ? 0 : offset * -5;
          const zIndex = isVisiblePair ? 50 : 50 - abs;
          const blur = isVisiblePair ? 0 : Math.min(2, abs * 0.6);
          const src = urls[slide.categoria] ?? slide.src;

          return (
            <button
              type="button"
              key={i}
              onClick={() => onSelect(slide, src)}
              aria-label={`Ver ${slide.title}`}
              className="group absolute top-1/2 left-1/2 h-[72%] w-[clamp(220px,32vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden border-2 border-sky-400/70 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.65),0_0_28px_rgba(56,155,255,0.35)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:border-sky-300 hover:shadow-[0_25px_65px_-8px_rgba(0,0,0,0.75),0_0_50px_rgba(56,189,248,0.75),0_0_0_1px_rgba(56,189,248,0.55)]"
              style={{
                transform: `translate(-50%, -50%) translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                opacity,
                zIndex,
                filter: blur ? `blur(${blur}px)` : undefined,
                pointerEvents: abs > 3 ? "none" : "auto",
                transformStyle: "preserve-3d",
              }}
            >
              <img
                src={src}
                alt={slide.title}
                crossOrigin="anonymous"
                loading={abs <= 1 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                sizes="(max-width: 640px) 60vw, (max-width: 1024px) 32vw, 340px"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-left">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#d8bf85]/90 mb-1">
                  Destaque
                </p>
                <h3 className="font-display text-xl sm:text-2xl text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
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
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[60] h-12 w-12 rounded-full flex items-center justify-center bg-background/60 backdrop-blur border border-sky-400/50 text-sky-200 hover:text-sky-100 hover:border-sky-300 hover:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Próximo"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[60] h-12 w-12 rounded-full flex items-center justify-center bg-background/60 backdrop-blur border border-sky-400/50 text-sky-200 hover:text-sky-100 hover:border-sky-300 hover:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-2 left-0 right-0 z-[60] flex justify-center gap-2">
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


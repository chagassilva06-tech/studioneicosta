import { useEffect, useRef, useState } from "react";
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
};

const RING_COUNT = 10;

export function FeaturedRing({ slides, urls, onSelect, autoplayMs = 1400 }: Props) {
  const items = Array.from({ length: RING_COUNT }, (_, i) => slides[i % slides.length]);
  const step = 360 / RING_COUNT;

  const [rotation, setRotation] = useState(0);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragState = useRef<{ startX: number; startRot: number; moved: boolean } | null>(null);

  const rotate = (dir: 1 | -1) => setRotation((r) => r - dir * step);

  useEffect(() => {
    if (hover || dragging) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timerRef.current = setInterval(() => setRotation((r) => r - step), autoplayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hover, dragging, step, autoplayMs]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragState.current = { startX: e.clientX, startRot: rotation, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 3) dragState.current.moved = true;
    // 1deg per 2px drag
    setRotation(dragState.current.startRot + dx * 0.5);
  };
  const onPointerUp = () => {
    if (dragState.current) {
      // snap to nearest step
      setRotation((r) => Math.round(r / step) * step);
    }
    dragState.current = null;
    setDragging(false);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-3xl"
      style={{
        height: "clamp(360px, 55vw, 520px)",
        perspective: "1400px",
        transformStyle: "preserve-3d",
        touchAction: "pan-y",
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: "clamp(140px, 20vw, 200px)",
          height: "clamp(210px, 30vw, 300px)",
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) rotateY(${rotation}deg)`,
          transition: dragging ? "none" : `transform ${autoplayMs}ms linear`,
          willChange: "transform",
        }}
      >
        {items.map((slide, i) => {
          const src = urls[slide.categoria] ?? slide.src;
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                if (dragState.current?.moved) {
                  e.preventDefault();
                  return;
                }
                onSelect(slide, src);
              }}
              className="absolute inset-0 rounded-xl overflow-hidden border-2 border-sky-400/70 shadow-[0_15px_30px_rgba(0,0,0,0.35),0_0_22px_rgba(56,155,255,0.4)] hover:border-sky-300 hover:shadow-[0_0_36px_rgba(56,155,255,0.85)] transition-shadow"
              style={{
                transform: `rotateY(${i * step}deg) translateZ(var(--ring-radius, 260px))`,
                backfaceVisibility: "hidden",
              }}
              aria-label={`${slide.title} — ver detalhes`}
            >
              <img
                src={src}
                alt={slide.title}
                crossOrigin="anonymous"
                loading={i < 3 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i === 0 ? "high" : "low"}
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover object-center select-none [backface-visibility:hidden]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-left">
                <p className="text-[9px] uppercase tracking-[0.3em] text-sky-300/90 mb-0.5">
                  Destaque {i + 1}
                </p>
                <h3 className="font-display text-lg truncate text-foreground">{slide.title}</h3>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @media (min-width: 640px) { :root { --ring-radius: 320px; } }
        @media (max-width: 639px) { :root { --ring-radius: 220px; } }
      `}</style>

      <button
        type="button"
        onClick={() => rotate(-1)}
        aria-label="Imagem anterior"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-16 w-12 flex items-center justify-center text-white/90 hover:text-sky-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-colors"
      >
        <ChevronLeft className="h-10 w-10" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => rotate(1)}
        aria-label="Próxima imagem"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-16 w-12 flex items-center justify-center text-white/90 hover:text-sky-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-colors"
      >
        <ChevronRight className="h-10 w-10" strokeWidth={1.5} />
      </button>
    </div>
  );
}

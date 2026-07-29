import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ImageIcon, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

export type LightboxData = {
  src?: string;
  title: string;
  description: string;
  categoria?: string;
} | null;

export function Lightbox({
  data,
  onClose,
}: {
  data: LightboxData;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!data) return;
    resetZoom();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 4));
      if (e.key === "-" || e.key === "_") setScale((s) => Math.max(s - 0.25, 1));
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [data, onClose, resetZoom]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 4);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragStart.current.x) / scale;
    const dy = (e.clientY - dragStart.current.y) / scale;
    setPosition({
      x: posStart.current.x + dx,
      y: posStart.current.y + dy,
    });
  };

  const handleMouseUp = () => setDragging(false);

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2);
    }
  };

  const openOriginal = () => {
    if (data?.src) window.open(data.src, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-background/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border-2 border-sky-400/70 bg-card shadow-[0_0_0_1px_rgba(56,155,255,0.4),0_30px_90px_-20px_rgba(56,155,255,0.55)]"
          >
            <div
              ref={containerRef}
              className="relative aspect-[4/5] sm:aspect-[16/10] bg-background min-h-[280px] overflow-hidden cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
            >
              {data.src ? (
                <img
                  src={data.src}
                  alt={data.title}
                  draggable={false}
                  className="absolute inset-0 m-auto h-full w-full object-contain transition-transform duration-200 ease-out will-change-transform"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="absolute inset-0 animate-glow-pulse" />
                  <div className="relative p-5 rounded-full bg-sky-400/10 border border-sky-400/30">
                    <ImageIcon className="h-8 w-8 text-sky-300" />
                  </div>
                  <p className="relative font-display text-2xl">Em breve</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-sky-400/60 shadow-[inset_0_0_14px_rgba(56,189,248,0.5),0_0_16px_rgba(56,189,248,0.4)]" />

              {/* Ver Maior button — corner of the image */}
              {data.src && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openOriginal();
                  }}
                  className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-sky-100 border border-sky-400/80 bg-background/70 backdrop-blur shadow-[0_0_14px_rgba(56,155,255,0.55)] hover:bg-sky-400/20 hover:border-sky-300 hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] transition-all"
                  aria-label="Ver maior"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ver maior</span>
                </button>
              )}

              {/* Zoom controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-background/70 backdrop-blur border border-sky-400/50 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScale((s) => Math.max(s - 0.25, 1));
                  }}
                  className="p-1.5 rounded-full text-sky-300 hover:text-sky-100 hover:bg-sky-400/15 transition"
                  aria-label="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-foreground/90 min-w-[3ch] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScale((s) => Math.min(s + 0.25, 4));
                  }}
                  className="p-1.5 rounded-full text-sky-300 hover:text-sky-100 hover:bg-sky-400/15 transition"
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoom();
                  }}
                  className="p-1.5 rounded-full text-sky-300 hover:text-sky-100 hover:bg-sky-400/15 transition"
                  aria-label="Resetar zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Scroll hint */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-3 py-1.5 rounded-full bg-background/60 backdrop-blur border border-sky-400/30 text-[10px] text-sky-200/90 tracking-wide">
                Role o mouse para ampliar · arraste para mover
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute top-3 left-3 p-2 rounded-full border-2 border-sky-400/70 bg-background/70 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] hover:border-sky-300 hover:text-sky-100 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


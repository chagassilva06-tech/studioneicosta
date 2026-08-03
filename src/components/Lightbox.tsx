import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ImageIcon, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useDominantColor, rgbTriplet } from "@/hooks/use-dominant-color";


export type LightboxData = {
  src?: string;
  title: string;
  description: string;
  categoria?: string;
} | null;

export function Lightbox({
  data,
  onClose,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
}: {
  data: LightboxData;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
} & {
  hasPrev?: boolean;
  hasNext?: boolean;
}) {
  const [zoomed, setZoomed] = useState(false);
  const dominant = useDominantColor(data?.src ?? null);
  const triplet = rgbTriplet(dominant) ?? "56, 155, 255";

  useEffect(() => {
    if (!data) return;
    setZoomed(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [data, onClose]);

  const glow = `0 0 0 1px rgba(${triplet}, 0.55), 0 0 32px rgba(${triplet}, 0.45), 0 20px 80px -10px rgba(${triplet}, 0.55), 0 30px 100px rgba(0,0,0,0.7)`;
  const glowHover = `0 0 0 1px rgba(${triplet}, 0.8), 0 0 60px rgba(${triplet}, 0.75), 0 30px 120px -10px rgba(${triplet}, 0.7), 0 40px 140px rgba(0,0,0,0.8)`;

  const overlay = (
    <AnimatePresence>
      {data && (

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl overflow-auto lightbox-scroll p-3 sm:p-6 overscroll-contain"
          onClick={onClose}
        >
          {data.src ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative m-auto group"
              onClick={(e) => e.stopPropagation()}
              style={{
                filter: `drop-shadow(0 0 24px rgba(${triplet}, 0.35))`,
              }}
            >
              <div
                className={
                  zoomed
                    ? "max-w-[94vw] max-h-[88dvh] overflow-auto rounded-2xl lightbox-scroll overscroll-contain"
                    : ""
                }
              >
                <img
                  src={data.src}
                  alt={data.title}
                  draggable={false}
                  onDoubleClick={() => setZoomed((z) => !z)}
                  className={
                    zoomed
                      ? "block max-w-none w-auto h-auto rounded-2xl select-none transition-[box-shadow] duration-500 cursor-zoom-out"
                      : "block max-w-[94vw] max-h-[86dvh] w-auto h-auto object-contain rounded-2xl select-none transition-[box-shadow,transform] duration-500 hover:scale-[1.005] cursor-zoom-in"
                  }
                  style={{
                    boxShadow: glow,
                    border: `1px solid rgba(${triplet}, 0.4)`,
                    ...(zoomed ? { transform: "scale(1.6)", transformOrigin: "center center" } : null),
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLImageElement).style.boxShadow = glowHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLImageElement).style.boxShadow = glow;
                  }}
                />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Fechar"
                className="absolute top-2 right-2 z-[110] inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-400/70 bg-background/80 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] hover:border-sky-300 hover:text-sky-100 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed((z) => !z);
                }}
                aria-label={zoomed ? "Reduzir imagem" : "Ampliar imagem"}
                className="absolute top-2 right-[3.75rem] z-[110] inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-400/70 bg-background/80 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] hover:border-sky-300 hover:text-sky-100 transition-all"
              >
                {zoomed ? (
                  <ZoomOut className="h-5 w-5" />
                ) : (
                  <ZoomIn className="h-5 w-5" />
                )}
              </button>

              {onPrev && hasPrev && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                  }}
                  title="Foto anterior"
                  aria-label="Foto anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-400/70 bg-background/60 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.4)] hover:shadow-[0_0_22px_rgba(56,155,255,0.8)] hover:border-sky-300 hover:text-sky-100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {onNext && hasNext && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  title="Próxima foto da galeria"
                  aria-label="Próxima foto da galeria"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-400/70 bg-background/60 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.4)] hover:shadow-[0_0_22px_rgba(56,155,255,0.8)] hover:border-sky-300 hover:text-sky-100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

            </motion.div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col items-center justify-center gap-4 p-10"
            >
              <div className="p-5 rounded-full bg-sky-400/10 border border-sky-400/30">
                <ImageIcon className="h-8 w-8 text-sky-300" />
              </div>
              <p className="font-display text-2xl">Em breve</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}


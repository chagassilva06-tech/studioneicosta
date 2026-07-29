import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ImageIcon, ZoomIn, ZoomOut } from "lucide-react";

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
  const [zoomed, setZoomed] = useState(false);

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

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl overflow-hidden"
          onClick={onClose}
          onWheel={(e) => e.preventDefault()}
        >
          {data.src ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={data.src}
                alt={data.title}
                draggable={false}
                className={
                  zoomed
                    ? "max-w-none max-h-none w-auto h-[150vh] object-contain select-none"
                    : "max-w-[92vw] max-h-[92vh] w-auto h-auto object-contain select-none"
                }
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Fechar"
                className="absolute top-2 right-2 z-[110] p-2 rounded-full border-2 border-sky-400/70 bg-background/80 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] hover:border-sky-300 hover:text-sky-100 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed((z) => !z);
                }}
                aria-label={zoomed ? "Reduzir imagem" : "Ampliar imagem"}
                className="absolute bottom-2 right-2 z-[110] p-2 rounded-full border-2 border-sky-400/70 bg-background/80 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] hover:border-sky-300 hover:text-sky-100 transition-all"
              >
                {zoomed ? (
                  <ZoomOut className="h-5 w-5" />
                ) : (
                  <ZoomIn className="h-5 w-5" />
                )}
              </button>
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
}

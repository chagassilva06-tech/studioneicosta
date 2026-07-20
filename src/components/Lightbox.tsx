import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ImageIcon } from "lucide-react";

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
  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-background/85 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[90vh] grid md:grid-cols-[1.4fr_1fr] gap-0 rounded-2xl overflow-hidden border-2 border-sky-400/70 bg-card shadow-[0_0_0_1px_rgba(56,155,255,0.4),0_30px_90px_-20px_rgba(56,155,255,0.55)]"
          >
            <div className="relative aspect-[4/5] md:aspect-auto bg-background min-h-[280px]">
              {data.src ? (
                <img
                  src={data.src}
                  alt={data.title}
                  className="absolute inset-0 h-full w-full object-contain"
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
            </div>

            <div className="relative p-6 sm:p-8 flex flex-col justify-center bg-background/95">
              {data.categoria && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-sky-400" />
                  <span className="uppercase tracking-[0.3em] text-[10px] text-sky-300/90">
                    {data.categoria}
                  </span>
                </div>
              )}
              <h3 className="font-display text-3xl sm:text-4xl font-light mb-4 drop-shadow-[0_0_10px_rgba(56,155,255,0.35)]">
                {data.title}
              </h3>
              <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
                {data.description}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute top-3 right-3 p-2 rounded-full border-2 border-sky-400/70 bg-background/70 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] hover:border-sky-300 hover:text-sky-100 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

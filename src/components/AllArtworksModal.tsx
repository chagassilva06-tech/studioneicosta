import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { LightboxData } from "@/components/Lightbox";

type Item = {
  id: string;
  categoria: string;
  slot: number;
  storage_path: string;
  url: string;
  srcSet: string;
};

const BUCKET = "artworks";
const TTL = 60 * 60 * 24 * 365;

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenLightbox: (data: LightboxData) => void;
};

export const AllArtworksModal = memo(function AllArtworksModal({ open, onClose, onOpenLightbox }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("Todas");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("artworks")
        .select("id, categoria, slot, storage_path")
        .order("categoria", { ascending: true })
        .order("slot", { ascending: true });
      if (!data || cancelled) {
        setLoading(false);
        return;
      }
      const signed = await Promise.all(
        data.map(async (r) => {
          const [sm, lg] = await Promise.all([
            supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, TTL, {
              transform: { width: 480, quality: 72, resize: "contain" },
            }),
            supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, TTL, {
              transform: { width: 900, quality: 78, resize: "contain" },
            }),
          ]);
          const url = lg.data?.signedUrl ?? sm.data?.signedUrl ?? "";
          const srcSet = [
            sm.data?.signedUrl ? `${sm.data.signedUrl} 480w` : null,
            lg.data?.signedUrl ? `${lg.data.signedUrl} 900w` : null,
          ]
            .filter(Boolean)
            .join(", ");
          return { ...r, url, srcSet };
        }),
      );
      if (cancelled) return;
      setItems(signed.filter((s) => s.url));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const categorias = Array.from(new Set(items.map((i) => i.categoria))).sort();
  const filtered = filter === "Todas" ? items : items.filter((i) => i.categoria === filter);

  const overlay = (
    <div
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-6 sm:px-12 py-5 sm:py-6 border-b border-white/5 bg-background/50 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-display text-xl sm:text-2xl truncate">
            Todas as <span className="italic text-[#d8bf85]">Obras</span>
            <span className="ml-2 text-sm text-muted-foreground">({filtered.length})</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="h-9 w-9 rounded-full inline-flex items-center justify-center text-sky-200 hover:bg-sky-400/15 border border-sky-400/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="flex gap-3 overflow-x-auto px-6 sm:px-12 py-4 border-b border-white/5 bg-background/30 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {["Todas", ...categorias].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 ${
              filter === c
                ? "bg-white text-slate-950 border-white shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)]"
                : "text-foreground/60 border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sky-300/80">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhuma obra encontrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((it) => (
              <button
                key={it.id}
                onClick={() =>
                  onOpenLightbox({
                    src: it.url,
                    title: `${it.categoria} — obra ${it.slot + 1}`,
                    description: `Obra da coleção ${it.categoria}.`,
                    categoria: it.categoria,
                  })
                }
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_50px_-8px_rgba(56,189,248,0.2)] hover:border-sky-400/40 transition-all duration-500"
              >
                <img
                  src={it.url}
                  srcSet={it.srcSet}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                  alt={`${it.categoria} — ${it.slot + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.08]"
                />
                <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 bg-gradient-to-t from-background/95 to-transparent text-[9px] uppercase tracking-[0.4em] text-white/50 text-left">
                  {it.categoria}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
});



import { useEffect, useState } from "react";
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

export function AllArtworksModal({ open, onClose, onOpenLightbox }: Props) {
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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-sky-400/20 bg-background/80"
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
        className="flex gap-2 overflow-x-auto px-4 sm:px-8 py-3 border-b border-sky-400/10 bg-background/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {["Todas", ...categorias].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === c
                ? "bg-sky-400 text-slate-950 border-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.6)]"
                : "text-foreground/80 border-sky-400/30 hover:border-sky-300 hover:bg-sky-400/10"
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
                className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-sky-400/40 bg-card/50 shadow-[0_0_14px_rgba(56,155,255,0.25)] hover:shadow-[0_0_28px_rgba(56,155,255,0.7)] hover:border-sky-300 transition-all"
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
                <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-background/90 to-transparent text-[10px] uppercase tracking-[0.25em] text-sky-200/90 text-left">
                  {it.categoria}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

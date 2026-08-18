import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { memo, lazy, Suspense, useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageIcon, Upload, RefreshCw, Loader2, LogOut, Star, Plus, Trash2, MoveHorizontal } from "lucide-react";
import { toast } from "sonner";
import paisagem1 from "@/assets/paisagem-1.webp";
import pintura1 from "@/assets/pintura-1.webp";
import type { LightboxData } from "@/components/Lightbox";
const Lightbox = lazy(() => import("@/components/Lightbox").then((m) => ({ default: m.Lightbox })));
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useDominantColor, rgbTriplet } from "@/hooks/use-dominant-color";
import { compressImage } from "@/lib/compress-image";




const categoryImages: Record<string, string[]> = {
  Paisagem: [paisagem1],
  Pintura: [pintura1],
};

const categoryDescriptions: Record<string, string> = {
  Paisagem:
    "Estudo de paisagem explorando luz natural, profundidade e atmosfera. Composição pensada para transmitir serenidade e a força silenciosa do ambiente retratado.",
  Pintura:
    "Obra em técnica mista, com camadas de cor trabalhadas para revelar textura, contraste e movimento. Cada pincelada compõe o gesto e a expressão da peça.",
  Retrato:
    "Retrato construído com foco em traços humanos, expressão do olhar e volume da luz sobre a pele. Trabalho autoral em desenvolvimento.",
  Anime:
    "Ilustração de estilo anime com linhas limpas, sombreamento estilizado e paleta vibrante. Nova obra em produção.",
  Animais:
    "Estudo de anatomia animal, com atenção à textura do pelo, olhar e postura. Peça inédita chegando em breve.",
  Estudo:
    "Estudo técnico exploratório — proporção, luz e forma. Base para obras futuras da coleção.",
};

const BUCKET = "artworks";
const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

export const Route = createFileRoute("/galeria/$categoria")({
  head: ({ params }) => {
    const nome = decodeURIComponent(params.categoria);
    return {
      meta: [
        { title: `${nome} — StudioNei` },
        { name: "description", content: `Galeria de ${nome} — StudioNei. Novas obras em breve.` },
        { property: "og:title", content: `${nome} — StudioNei` },
        { property: "og:description", content: `Coleção de ${nome}. Novas obras em breve.` },
      ],
    };
  },
  component: Galeria,
});

function Galeria() {
  const { categoria } = useParams({ from: "/galeria/$categoria" });
  const nome = decodeURIComponent(categoria);
  const images = categoryImages[nome] ?? [];
  const BASE_SLOTS = 10;
  const extraKey = `studionei:extra-slots:${nome}`;
  const [extraSlots, setExtraSlots] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = Number(window.localStorage.getItem(extraKey) ?? "0");
    setExtraSlots(Number.isFinite(saved) && saved > 0 ? saved : 0);
  }, [extraKey]);

  const addSlot = () => {
    setExtraSlots((n) => {
      const next = n + 1;
      if (typeof window !== "undefined") window.localStorage.setItem(extraKey, String(next));
      return next;
    });
  };

  const total = BASE_SLOTS + extraSlots;
  const slots = useMemo(() => Array.from({ length: total }), [total]);
  const [lightbox, setLightbox] = useState<LightboxData>(null);
  const [uploaded, setUploaded] = useState<Record<number, { path: string; url: string; srcSet: string; featured: boolean }>>({});
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [togglingSlot, setTogglingSlot] = useState<number | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null);
  const [movingSlot, setMovingSlot] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; sort_order: number }[]>([]);
  const [catDescription, setCatDescription] = useState<string | null>(null);

  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});
  const desc = catDescription || categoryDescriptions[nome] || `Obra da coleção ${nome}.`;
  const { isAdmin, userEmail } = useAdmin();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const signVariants = async (path: string) => {
    const [small, large] = await Promise.all([
      supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL, {
        transform: { width: 480, quality: 72, resize: "contain" },
      }),
      supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL, {
        transform: { width: 900, quality: 78, resize: "contain" },
      }),
    ]);
    const url = large.data?.signedUrl ?? small.data?.signedUrl ?? "";
    const srcSet = [
      small.data?.signedUrl ? `${small.data.signedUrl} 480w` : null,
      large.data?.signedUrl ? `${large.data.signedUrl} 900w` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return { url, srcSet };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("slot, storage_path, featured")
        .eq("categoria", nome)
        .order("slot", { ascending: true });
      if (error || !data || cancelled) return;
      if (data.length === 0) return;
      const variants = await Promise.all(data.map((r) => signVariants(r.storage_path)));
      if (cancelled) return;
      const next: Record<number, { path: string; url: string; srcSet: string; featured: boolean }> = {};
      data.forEach((row, idx) => {
        const v = variants[idx];
        if (v.url) next[row.slot] = { path: row.storage_path, url: v.url, srcSet: v.srcSet, featured: Boolean((row as { featured?: boolean }).featured) };
      });
      setUploaded(next);
      const maxSlot = Math.max(...data.map((r) => r.slot));
      if (maxSlot >= BASE_SLOTS) {
        setExtraSlots((n) => Math.max(n, maxSlot - BASE_SLOTS + 1));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nome]);

  const handleUpload = async (i: number, file?: File | null) => {
    if (!file) return;
    setUploadingSlot(i);
    try {
      const { file: optimized, ext, originalSize, size } = await compressImage(file);
      if (size < originalSize) {
        console.info(
          `[upload] ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(size / 1024 / 1024).toFixed(2)}MB`,
        );
      }
      const path = `${nome}/slot-${i}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, optimized, { upsert: true, contentType: optimized.type });
      if (upErr) throw upErr;


      const previous = uploaded[i]?.path;

      const { error: dbErr } = await supabase
        .from("artworks")
        .upsert(
          { categoria: nome, slot: i, storage_path: path, updated_at: new Date().toISOString() },
          { onConflict: "categoria,slot" },
        );
      if (dbErr) throw dbErr;

      if (previous && previous !== path) {
        await supabase.storage.from(BUCKET).remove([previous]);
      }

      const v = await signVariants(path);
      if (v.url) {
        setUploaded((prev) => ({
          ...prev,
          [i]: { path, url: v.url, srcSet: v.srcSet, featured: prev[i]?.featured ?? false },
        }));
      }
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Falha ao enviar imagem. Tente novamente.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleToggleFeatured = async (i: number) => {
    const current = uploaded[i];
    if (!current) return;
    setTogglingSlot(i);
    try {
      const nextValue = !current.featured;
      if (nextValue) {
        // Clear any other featured in this categoria first (unique index enforces one)
        await supabase
          .from("artworks")
          .update({ featured: false })
          .eq("categoria", nome)
          .eq("featured", true);
      }
      const { error } = await supabase
        .from("artworks")
        .update({ featured: nextValue })
        .eq("categoria", nome)
        .eq("slot", i);
      if (error) throw error;
      setUploaded((prev) => {
        const updated: typeof prev = {};
        for (const [k, v] of Object.entries(prev)) {
          updated[Number(k)] = { ...v, featured: false };
        }
        if (updated[i]) updated[i].featured = nextValue;
        return updated;
      });
    } catch (e) {
      console.error("Toggle featured failed", e);
      toast.error("Falha ao marcar como destaque.");
    } finally {
      setTogglingSlot(null);
    }
  };

  const askDelete = (i: number) => {
    setDeletingSlot(i);
  };

  const confirmDelete = async () => {
    if (deletingSlot === null) return;
    const i = deletingSlot;
    const current = uploaded[i];
    if (!current) {
      setDeletingSlot(null);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("artworks")
        .delete()
        .eq("categoria", nome)
        .eq("slot", i);
      if (error) throw error;
      if (current.path) {
        await supabase.storage.from(BUCKET).remove([current.path]);
      }
      setUploaded((prev) => {
        const next = { ...prev };
        delete next[i];
        return next;
      });
      toast.success("Imagem apagada com sucesso");
    } catch (e) {
      console.error("Delete failed", e);
      toast.error("Falha ao apagar imagem.");
    } finally {
      setDeletingSlot(null);
    }
  };
  
  const handleMove = async (i: number, targetCategoria: string, isUndo = false) => {
    const current = uploaded[i];
    if (!current || !targetCategoria || targetCategoria === nome) return;
    setMovingSlot(i);
    try {
      const { data: targetArtworks } = await supabase
        .from("artworks")
        .select("slot")
        .eq("categoria", targetCategoria)
        .order("slot", { ascending: true });
      
      const takenSlots = new Set((targetArtworks ?? []).map(a => a.slot));
      let nextSlot = 0;
      while (takenSlots.has(nextSlot)) {
        nextSlot++;
      }

      const { error } = await supabase
        .from("artworks")
        .update({ categoria: targetCategoria, slot: nextSlot, featured: false })
        .eq("categoria", nome)
        .eq("slot", i);
      
      if (error) throw error;

      setUploaded((prev) => {
        const next = { ...prev };
        delete next[i];
        return next;
      });

      if (!isUndo) {
        toast.success(`Imagem movida para ${targetCategoria}`, {
          description: "A imagem foi transferida com sucesso.",
          action: {
            label: "Cancelar",
            onClick: () => handleUndoMove(targetCategoria, nextSlot, i),
          },
        });
      }
    } catch (e) {
      console.error("Move failed", e);
      toast.error("Falha ao mover imagem.");
    } finally {
      setMovingSlot(null);
    }
  };

  const handleUndoMove = async (fromCat: string, fromSlot: number, originalSlot: number) => {
    try {
      const { error } = await supabase
        .from("artworks")
        .update({ categoria: nome, slot: originalSlot, featured: false })
        .eq("categoria", fromCat)
        .eq("slot", fromSlot);
      
      if (error) throw error;

      // Re-fetch or update local state for the original slot
      const v = await signVariants(uploaded[originalSlot]?.path || ""); // This might not work if state was deleted
      // Actually, we need to know the path. 
      // But wait, if I moved it, I deleted it from 'uploaded'.
      // I should probably just trigger a re-load of the gallery data.
      
      // Simpler: reload data
      const { data } = await supabase
        .from("artworks")
        .select("storage_path, featured")
        .eq("categoria", nome)
        .eq("slot", originalSlot)
        .single();
      
      if (data) {
        const v = await signVariants(data.storage_path);
        setUploaded(prev => ({
          ...prev,
          [originalSlot]: { 
            path: data.storage_path, 
            url: v.url, 
            srcSet: v.srcSet, 
            featured: data.featured 
          }
        }));
      }
      
      toast.success("Movimentação cancelada");
    } catch (e) {
      console.error("Undo move failed", e);
      toast.error("Não foi possível desfazer a ação.");
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("categories").select("id, name, description, sort_order").order("sort_order", { ascending: true });
      if (data) {
        setCategories(data);
        const current = data.find(c => c.name === nome);
        if (current?.description) setCatDescription(current.description);
      }
    })();
  }, [nome]);




  const navigateTo = (direction: 'next' | 'prev') => {
    if (!lightbox) return;
    const currentIndex = slots.findIndex((_, i) => {
      const baseImage = images[i];
      const image = uploaded[i]?.url ?? baseImage;
      return image === lightbox.src;
    });
    
    if (currentIndex === -1) return;
    
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    // Find next/prev slot with an image
    while (nextIndex >= 0 && nextIndex < slots.length) {
      const baseImg = images[nextIndex];
      const img = uploaded[nextIndex]?.url ?? baseImg;
      if (img) {
        setLightbox({
          src: img,
          title: `${nome} — obra ${nextIndex + 1}`,
          description: desc,
          categoria: nome,
        });
        return;
      }
      nextIndex = direction === 'next' ? nextIndex + 1 : nextIndex - 1;
    }
  };

  const hasNext = useMemo(() => {
    if (!lightbox) return false;
    const currentIndex = slots.findIndex((_, i) => (uploaded[i]?.url ?? images[i]) === lightbox.src);
    for (let i = currentIndex + 1; i < slots.length; i++) {
      if (uploaded[i]?.url ?? images[i]) return true;
    }
    return false;
  }, [lightbox, slots, uploaded, images]);

  const hasPrev = useMemo(() => {
    if (!lightbox) return false;
    const currentIndex = slots.findIndex((_, i) => (uploaded[i]?.url ?? images[i]) === lightbox.src);
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (uploaded[i]?.url ?? images[i]) return true;
    }
    return false;
  }, [lightbox, slots, uploaded, images]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-3xl bg-background/70 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group min-w-0 shrink">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#d8bf85] shadow-[0_0_12px_rgba(216,191,133,0.7)]" />
            <span
              className="text-xl sm:text-2xl md:text-3xl tracking-wide text-foreground truncate transition-all duration-500 group-hover:tracking-[0.06em]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Studio<span className="italic text-[#d8bf85]">Nei</span>
            </span>
          </Link>

          <div className="hidden lg:flex flex-1 justify-center px-4 overflow-hidden">
             <div className="flex items-center gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((c, idx) => {
                  const isActive = c.name === nome;
                  const catColor = [
                    "#0ea5e9", "#3b82f6", "#8b5cf6", "#d8bf85", 
                    "#10b981", "#f43f5e", "#ec4899", "#a855f7"
                  ][idx % 8];

                  return (
                    <Link
                      key={c.id}
                      to="/galeria/$categoria"
                      params={{ categoria: c.name }}
                      className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-300 border ${
                        isActive 
                        ? "bg-[#d8bf85]/10 border-[#d8bf85]/40 text-[#d8bf85] shadow-[0_0_15px_rgba(216,191,133,0.15)]" 
                        : "bg-white/[0.03] border-white/5 text-foreground/60 hover:text-white hover:border-white/20"
                      }`}
                      style={isActive ? { "--cat-color": catColor } as any : {}}
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: isActive ? "#d8bf85" : catColor }}
                      />
                      <span className="whitespace-nowrap">{c.name}</span>
                    </Link>
                  );
                })}
             </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAdmin ? (
              <button
                onClick={handleSignOut}
                title={userEmail ?? undefined}
                aria-label="Sair"
                className="group inline-flex items-center gap-2 text-xs font-bold text-[#d8bf85] border border-[#d8bf85]/30 rounded-full px-4 py-2 bg-[#d8bf85]/5 shadow-[0_0_15px_rgba(216,191,133,0.2)] hover:shadow-[0_0_25px_rgba(216,191,133,0.4)] hover:bg-[#d8bf85]/10 hover:border-[#d8bf85]/60 transition-all active:scale-[0.97]"
              >
                <LogOut className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" /> <span className="hidden sm:inline text-[#d8bf85]">Sair</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.28em] text-sky-200/70 border border-sky-400/30 rounded-full px-2.5 py-1">
                Visitante · leitura
              </span>
            )}
          </div>
        </div>
      </header>


      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-8 sm:mb-14 flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rule-gold w-10 sm:w-12" />
            <span className="label-luxe">Galeria</span>
            <div className="rule-gold w-10 sm:w-12" />
          </div>
          <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-light break-words animate-title-glow-subtle">{nome}</h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-lg italic">
            {desc}
          </p>


          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              aria-label="Voltar"
              className="group inline-flex min-h-[42px] items-center gap-2 text-xs sm:text-sm font-bold text-[#d8bf85] border border-[#d8bf85]/30 rounded-full px-6 py-2.5 bg-[#d8bf85]/5 shadow-[0_10px_20px_-5px_rgba(216,191,133,0.15)] hover:shadow-[0_15px_30px_-8px_rgba(216,191,133,0.3)] hover:border-[#d8bf85] hover:text-[#d8bf85] transition-all duration-300 active:scale-[0.97]"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Voltar
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((c, idx) => (
                <Link
                  key={c.id}
                  to="/galeria/$categoria"
                  params={{ categoria: c.name }}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] ${
                    c.name === nome
                      ? "border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)] bg-sky-400/10"
                      : "border-white/10 text-foreground/70 hover:text-white hover:border-white/20"
                  }`}
                  style={{
                    background: c.name === nome ? undefined : `linear-gradient(135deg, var(--btn-grad-from) 0%, var(--btn-grad-to) 100%)`,
                    "--btn-grad-from": [
                      "rgba(14,165,233,0.12)",
                      "rgba(139,92,246,0.12)",
                      "rgba(20,184,166,0.12)",
                      "rgba(244,63,94,0.12)",
                      "rgba(234,179,8,0.12)",
                      "rgba(16,185,129,0.12)",
                    ][idx % 6],
                    "--btn-grad-to": "rgba(255,255,255,0.01)",
                  } as any}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {isAdmin && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={addSlot}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-[0_15px_30px_-8px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" /> Adicionar card de foto
            </button>
          </div>
        )}



        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          {slots.map((_, i) => {
            const baseImage = images[i];
            const image = uploaded[i]?.url ?? baseImage;
            const srcSet = uploaded[i]?.srcSet;
            const isUploading = uploadingSlot === i;
            const isFeatured = uploaded[i]?.featured ?? false;
            const canToggle = Boolean(uploaded[i]);
            const isToggling = togglingSlot === i;
            return (
              <Slot
                key={i}
                index={i}
                nome={nome}
                image={image}
                srcSet={srcSet}
                desc={desc}
                isAdmin={isAdmin}
                isUploading={isUploading}
                isFeatured={isFeatured}
                canToggleFeatured={canToggle}
                isToggling={isToggling}
                onToggleFeatured={() => handleToggleFeatured(i)}
                canDelete={Boolean(uploaded[i])}
                isDeleting={deletingSlot === i}
                onDelete={() => askDelete(i)}
                hasNext={hasNext}
                hasPrev={hasPrev}
                canMove={Boolean(uploaded[i])}
                isMoving={movingSlot === i}
                categories={categories.filter(c => c.name !== nome)}
                onMove={(target) => handleMove(i, target)}
                registerInput={(el) => {
                  fileInputs.current[i] = el;
                }}
                onPickFile={() => fileInputs.current[i]?.click()}
                onFileChange={(f) => handleUpload(i, f)}
                onOpenLightbox={(data) => setLightbox(data)}
              />
            );
          })}
        </div>
      </section>
      <Suspense fallback={null}>
        {lightbox && (
          <Lightbox 
            data={lightbox} 
            onClose={() => setLightbox(null)} 
            onNext={() => navigateTo('next')}
            onPrev={() => navigateTo('prev')}
            hasNext={hasNext}
            hasPrev={hasPrev}
          />
        )}
      </Suspense>

      {/* Confirmação de exclusão de foto */}
      {deletingSlot !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-400/40 bg-background/95 p-6 shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)] text-center animate-in zoom-in-95 duration-200">
            <Trash2 className="h-10 w-10 text-rose-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Excluir imagem?</p>
            <p className="text-xs text-muted-foreground mb-6">
              Esta ação não pode ser desfeita. A imagem será removida permanentemente desta galeria.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingSlot(null)}
                className="px-5 py-2 rounded-lg border border-sky-400/40 text-sm font-medium hover:bg-sky-400/15 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 shadow-[0_0_20px_-4px_rgba(244,63,94,0.6)] transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type SlotProps = {
  index: number;
  nome: string;
  image?: string;
  srcSet?: string;
  desc: string;
  isAdmin: boolean;
  isUploading: boolean;
  isFeatured: boolean;
  canToggleFeatured: boolean;
  isToggling: boolean;
  onToggleFeatured: () => void;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  canMove: boolean;
  isMoving: boolean;
  categories: { id: string; name: string }[];
  onMove: (target: string) => void;
  registerInput: (el: HTMLInputElement | null) => void;
  onPickFile: () => void;
  onFileChange: (f?: File | null) => void;
  onOpenLightbox: (data: LightboxData) => void;
};

const Slot = memo(function Slot({
  index,
  nome,
  image,
  srcSet,
  desc,
  isAdmin,
  isUploading,
  isFeatured,
  canToggleFeatured,
  isToggling,
  onToggleFeatured,
  canDelete,
  isDeleting,
  onDelete,
  hasNext,
  hasPrev,
  canMove,
  isMoving,
  categories,
  onMove,
  registerInput,
  onPickFile,
  onFileChange,
  onOpenLightbox,
}: SlotProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const hasImage = Boolean(image);
  const dominant = useDominantColor(hasImage ? image : null);
  const triplet = rgbTriplet(dominant);
  const frameColor = dominant ?? "rgb(56, 189, 248)";
  const frameTriplet = triplet ?? "56, 189, 248";
  
  const frameStyle: React.CSSProperties = useMemo(() => ({
    borderColor: frameColor,
    boxShadow: `inset 0 0 12px rgba(${frameTriplet}, 0.55), 0 0 14px rgba(${frameTriplet}, 0.5)`,
  }), [frameColor, frameTriplet]);

  const cardHoverStyle: React.CSSProperties = useMemo(() => ({
    ["--frame" as string]: frameColor,
    ["--frame-triplet" as string]: frameTriplet,
  }), [frameColor, frameTriplet]);

  const openDetails = () =>
    onOpenLightbox({
      src: image,
      title: hasImage ? `${nome} — obra ${index + 1}` : "Em breve",
      description: hasImage
        ? desc
        : `Nova obra da categoria ${nome} chegando em breve. Fique atento às próximas publicações da coleção.`,
      categoria: nome,
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
      style={cardHoverStyle}
      onClick={openDetails}
      className="group relative aspect-[4/5] rounded-2xl border border-border/50 bg-card overflow-hidden cursor-zoom-in select-none transition-all duration-500 hover:-translate-y-1 hover:border-sky-400/70 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.35),0_18px_60px_-12px_rgba(56,189,248,0.55),0_0_38px_rgba(56,189,248,0.35)] will-change-transform"
    >
      {hasImage ? (
        <>
          <img
            src={image}
            srcSet={srcSet}
            alt={`${nome} — obra ${index + 1}`}
            loading="lazy"
            decoding="async"
            crossOrigin="anonymous"
            sizes="(max-width: 420px) 92vw, (max-width: 640px) 46vw, (max-width: 1024px) 45vw, (max-width: 1536px) 30vw, 22vw"
            className="absolute inset-0 h-full w-full object-contain p-2 sm:p-3 transition-transform duration-700 ease-out group-hover:scale-[1.22] will-change-transform"
          />
          <div className="pointer-events-none absolute inset-2 sm:inset-3 rounded-xl border-2 transition-all duration-500 group-hover:shadow-[inset_0_0_22px_rgba(56,189,248,0.55)]" style={frameStyle} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 animate-glow-pulse bg-white/[0.03]" />
          <div className="pointer-events-none absolute inset-2 sm:inset-3 rounded-xl border-2" style={frameStyle} />
          <div className="relative h-full w-full flex flex-col items-center justify-center gap-3 sm:gap-4 text-center px-4 sm:px-6">
            <div className="p-3 sm:p-4 rounded-full bg-sky-400/10 border border-sky-400/20">
              <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400/80" />
            </div>
            <div>
              <p className="font-display text-lg sm:text-xl">Em breve</p>
              <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground mt-2">
                Receberá fotos em breve
              </p>
            </div>
          </div>

        </>
      )}

      <input
        ref={registerInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          onFileChange(f);
        }}
      />

      {isAdmin && (
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex max-w-[calc(100%-0.75rem)] items-center gap-1">
          <button
            type="button"
            disabled={isUploading}
            title={hasImage ? "Substituir imagem" : "Carregar imagem"}
            aria-label={hasImage ? "Substituir imagem" : "Carregar imagem"}
            onClick={(e) => { e.stopPropagation(); onPickFile(); }}
            className="inline-flex max-w-full items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium tracking-wide border border-sky-400/80 text-sky-100 bg-background/70 backdrop-blur shadow-[0_0_8px_rgba(56,155,255,0.45)] hover:bg-sky-400/20 hover:border-sky-300 transition-all disabled:opacity-70"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
                <span className="truncate">Enviando…</span>
              </>
            ) : hasImage ? (
              <>
                <RefreshCw className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">Substituir</span>
              </>
            ) : (
              <>
                <Upload className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">Carregar</span>
              </>
            )}
          </button>

          {canDelete && (
            <button
              type="button"
              disabled={isDeleting}
              title="Apagar imagem"
              aria-label="Apagar imagem"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium tracking-wide border border-rose-400/70 text-rose-200 bg-background/70 backdrop-blur shadow-[0_0_8px_rgba(244,63,94,0.4)] hover:bg-rose-500/20 hover:border-rose-300 transition-all disabled:opacity-70"
            >
              {isDeleting ? (
                <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
              ) : (
                <Trash2 className="h-2.5 w-2.5 shrink-0" />
              )}
              <span className="truncate">Apagar</span>
            </button>
          )}
          
          {canMove && (
            <div className="relative">
              <button
                type="button"
                disabled={isMoving}
                title="Mover imagem para outra categoria"
                aria-label="Mover imagem para outra categoria"
                onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium tracking-wide border border-sky-400/70 text-sky-200 bg-background/70 backdrop-blur shadow-[0_0_8px_rgba(56,155,255,0.4)] hover:bg-sky-500/20 hover:border-sky-300 transition-all disabled:opacity-70"
              >
                {isMoving ? (
                  <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
                ) : (
                  <MoveHorizontal className="h-2.5 w-2.5 shrink-0" />
                )}
                <span className="truncate">Mover</span>
              </button>
              
              {showMoveMenu && (
                <div 
                  className="absolute top-full left-0 mt-1 w-32 max-h-40 overflow-y-auto z-[30] rounded-lg border border-sky-400/40 bg-background/95 backdrop-blur-md shadow-xl py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="px-2 py-1 text-[8px] uppercase tracking-wider text-sky-400/60 border-b border-sky-400/20 mb-1">Para:</p>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setShowMoveMenu(false); onMove(cat.name); }}
                      className="w-full text-left px-2 py-1.5 text-[10px] text-foreground hover:bg-sky-400/20 hover:text-sky-200 transition-colors truncate"
                    >
                      {cat.name}
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <p className="px-2 py-2 text-[9px] text-muted-foreground italic">Nenhuma opção</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isAdmin && confirmDelete && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
        >
          <div
            className="w-full max-w-[15rem] rounded-xl border border-rose-400/40 bg-background/95 p-4 text-center shadow-[0_0_30px_-8px_rgba(244,63,94,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-muted-foreground mb-1">Apagar esta imagem?</p>
            <p className="text-[10px] text-muted-foreground mb-4">O card ficará vazio.</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                className="px-3 py-1.5 rounded-lg border border-sky-400/40 text-[11px] font-medium hover:bg-sky-400/15 transition-colors"
              >
                Não
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); onDelete(); }}
                className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[11px] font-medium hover:bg-rose-400 transition-colors disabled:opacity-60"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camada de sobreposição para interação do Admin (opcional se quiser ícones extras) */}
      {isAdmin && hasImage && (
        <div className="absolute inset-0 z-10 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {/* Espaço reservado para interações futuras se necessário */}
        </div>
      )}


      {isAdmin && canToggleFeatured && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
          <button
            type="button"
            disabled={isToggling}
            onClick={(e) => { e.stopPropagation(); onToggleFeatured(); }}
            title={isFeatured ? "Remover destaque" : "Marcar como destaque"}
            aria-label={isFeatured ? "Remover destaque" : "Marcar como destaque"}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium tracking-wide border backdrop-blur transition-all disabled:opacity-70 ${
              isFeatured
                ? "border-[#d8bf85] text-slate-950 bg-[#d8bf85] shadow-[0_0_12px_rgba(216,191,133,0.7)]"
                : "border-[#d8bf85]/60 text-[#d8bf85] bg-background/70 hover:bg-[#d8bf85]/15 hover:border-[#d8bf85]"
            }`}
          >
            {isToggling ? (
              <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
            ) : (
              <Star className={`h-2.5 w-2.5 shrink-0 ${isFeatured ? "fill-current" : ""}`} />
            )}
            <span className="hidden sm:inline">{isFeatured ? "Destaque" : "Destacar"}</span>
          </button>
        </div>
      )}


      {isFeatured && !isAdmin && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#d8bf85]/90 text-slate-950 text-[10px] font-medium shadow-[0_0_14px_rgba(216,191,133,0.6)]">
          <Star className="h-3 w-3 shrink-0 fill-current" /> <span className="hidden xs:inline">Destaque</span>
        </div>
      )}


    </motion.div>
  );
});

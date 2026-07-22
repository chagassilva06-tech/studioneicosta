import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Upload, RefreshCw, Loader2, LogIn, LogOut } from "lucide-react";
import paisagem1 from "@/assets/paisagem-1.png";
import pintura1 from "@/assets/pintura-1.png";
import { Lightbox, type LightboxData } from "@/components/Lightbox";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";



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
  const total = 3;
  const slots = Array.from({ length: total });
  const [lightbox, setLightbox] = useState<LightboxData>(null);
  const [uploaded, setUploaded] = useState<Record<number, { path: string; url: string }>>({});
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});
  const desc = categoryDescriptions[nome] ?? `Obra da coleção ${nome}.`;
  const { isAdmin, userEmail } = useAdmin();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("slot, storage_path")
        .eq("categoria", nome);
      if (error || !data || cancelled) return;
      const paths = data.map((r) => r.storage_path);
      if (paths.length === 0) return;
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_TTL);
      if (cancelled || !signed) return;
      const next: Record<number, { path: string; url: string }> = {};
      data.forEach((row, idx) => {
        const s = signed[idx];
        if (s?.signedUrl) next[row.slot] = { path: row.storage_path, url: s.signedUrl };
      });
      setUploaded(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [nome]);

  const handleUpload = async (i: number, file?: File | null) => {
    if (!file) return;
    setUploadingSlot(i);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${nome}/slot-${i}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // Remove previous file for this slot (if any)
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

      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL);
      if (signed?.signedUrl) {
        setUploaded((prev) => ({ ...prev, [i]: { path, url: signed.signedUrl } }));
      }
    } catch (e) {
      console.error("Upload failed", e);
      alert("Falha ao enviar imagem. Tente novamente.");
    } finally {
      setUploadingSlot(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)]" />
            <span className="font-display text-2xl tracking-wide">
              Studio<span className="text-sky-400">Nei</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <button
                onClick={handleSignOut}
                title={userEmail ?? undefined}
                className="group inline-flex items-center gap-2 text-xs font-medium text-sky-400 border border-sky-400/60 rounded-full px-3 py-1.5 bg-sky-400/5 shadow-[0_0_12px_rgba(56,155,255,0.35)] hover:shadow-[0_0_24px_rgba(56,155,255,0.7)] hover:border-sky-300 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            ) : (
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 text-xs font-medium text-sky-400 border border-sky-400/60 rounded-full px-3 py-1.5 bg-sky-400/5 shadow-[0_0_12px_rgba(56,155,255,0.35)] hover:shadow-[0_0_24px_rgba(56,155,255,0.7)] hover:border-sky-300 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <Link
              to="/"
              className="group inline-flex items-center gap-2 text-sm font-medium text-sky-400 border border-sky-400/60 rounded-full px-4 py-1.5 bg-sky-400/5 shadow-[0_0_12px_rgba(56,155,255,0.35)] hover:shadow-[0_0_24px_rgba(56,155,255,0.7)] hover:border-sky-300 hover:text-sky-300 hover:bg-sky-400/10 transition-all duration-300 animate-pulse-slow"
            >
              <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" /> Voltar
            </Link>
          </div>

        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-10 sm:mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-sky-400" />
            <span className="uppercase tracking-[0.4em] text-xs text-sky-400/90">Categoria</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-light">{nome}</h1>
          <p className="mt-4 text-muted-foreground max-w-lg">
            Esta coleção receberá fotos em breve. Volte em breve para conferir novas obras.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {slots.map((_, i) => {
            const baseImage = images[i];
            const image = uploaded[i]?.url ?? baseImage;
            const hasImage = Boolean(image);
            const isUploading = uploadingSlot === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
                className="group relative aspect-[4/5] rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-sky-400/70 hover:shadow-[0_0_0_1px_rgba(56,155,255,0.4),0_20px_60px_-15px_rgba(56,155,255,0.4)] transition-all duration-500"
              >
                {hasImage ? (
                  <>
                    <img
                      src={image}
                      alt={`${nome} — obra ${i + 1}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-125"
                    />
                    <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-sky-400/70 shadow-[inset_0_0_12px_rgba(56,189,248,0.55),0_0_14px_rgba(56,189,248,0.5)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 animate-glow-pulse bg-white/[0.03] transition-transform duration-700 ease-out group-hover:scale-110" />
                    <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-sky-400/70 shadow-[inset_0_0_12px_rgba(56,189,248,0.55),0_0_14px_rgba(56,189,248,0.5)]" />
                    <div className="relative h-full w-full flex flex-col items-center justify-center gap-4 text-center px-6 transition-transform duration-700 ease-out group-hover:scale-110">
                      <div className="p-4 rounded-full bg-sky-400/10 border border-sky-400/20">
                        <ImageIcon className="h-6 w-6 text-sky-400/80" />
                      </div>
                      <div>
                        <p className="font-display text-xl">Em breve</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-2">
                          Receberá fotos em breve
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <input
                  ref={(el) => {
                    fileInputs.current[i] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    handleUpload(i, f);
                  }}
                />

                {isAdmin && (
                  <div className="absolute top-3 left-3 z-10 opacity-100 translate-y-0 lg:opacity-0 lg:-translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-500">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputs.current[i]?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide border-2 border-sky-400/80 text-sky-100 bg-background/70 backdrop-blur shadow-[0_0_14px_rgba(56,155,255,0.55)] hover:bg-sky-400/20 hover:border-sky-300 hover:shadow-[0_0_22px_rgba(56,155,255,0.9)] transition-all disabled:opacity-70"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…
                        </>
                      ) : hasImage ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" /> Substituir imagem
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" /> Carregar imagem
                        </>
                      )}
                    </button>
                  </div>
                )}


                <div className="absolute bottom-4 left-4 right-4 flex justify-center z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({
                        src: image,
                        title: hasImage ? `${nome} — obra ${i + 1}` : "Em breve",
                        description: hasImage
                          ? desc
                          : `Nova obra da categoria ${nome} chegando em breve. Fique atento às próximas publicações da coleção.`,
                        categoria: nome,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wide border-2 border-sky-400/80 text-sky-100 bg-background/70 backdrop-blur shadow-[0_0_18px_rgba(56,155,255,0.55)] hover:bg-sky-400/20 hover:border-sky-300 hover:shadow-[0_0_26px_rgba(56,155,255,0.9)] transition-all"
                  >
                    Ver detalhes
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
      <Lightbox data={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

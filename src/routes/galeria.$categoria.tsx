import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/galeria/$categoria")({
  head: ({ params }) => {
    const nome = decodeURIComponent(params.categoria);
    return {
      meta: [
        { title: `${nome} — StudioNei` },
        {
          name: "description",
          content: `Galeria de ${nome} — StudioNei. Novas obras em breve.`,
        },
        { property: "og:title", content: `${nome} — StudioNei` },
        {
          property: "og:description",
          content: `Coleção de ${nome}. Novas obras em breve.`,
        },
      ],
    };
  },
  component: Galeria,
});

function Galeria() {
  const { categoria } = useParams({ from: "/galeria/$categoria" });
  const nome = decodeURIComponent(categoria);
  const slots = Array.from({ length: 8 });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)]" />
            <span className="font-display text-2xl tracking-wide">
              Studio<span className="text-sky-400">Nei</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-sky-400 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-sky-400" />
            <span className="uppercase tracking-[0.4em] text-xs text-sky-400/90">
              Categoria
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-light">
            {nome}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-lg">
            Esta coleção receberá fotos em breve. Volte em breve para conferir novas obras.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
              className="group relative aspect-[4/5] rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-sky-400/70 hover:shadow-[0_0_0_1px_rgba(56,155,255,0.4),0_20px_60px_-15px_rgba(56,155,255,0.4)] transition-all duration-500"
            >
              <div className="absolute inset-0 animate-glow-pulse bg-white/[0.03]" />
              <div className="relative h-full w-full flex flex-col items-center justify-center gap-4 text-center px-6">
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
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

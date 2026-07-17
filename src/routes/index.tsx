import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  Moon,
  Sun,
  Instagram,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Maximize2,
  Play,
  Eye,
} from "lucide-react";

import hero from "@/assets/hero.jpg";
import artLandscape from "@/assets/art-landscape.jpg";
import artPortrait from "@/assets/art-portrait.jpg";
import artAnime from "@/assets/art-anime.jpg";
import artForest from "@/assets/art-forest.jpg";
import artHorse from "@/assets/art-horse.jpg";
import artStreet from "@/assets/art-street.jpg";
import artEye from "@/assets/art-eye.jpg";
import artist from "@/assets/artist.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudioNei — Galeria de Desenhos e Pinturas" },
      {
        name: "description",
        content:
          "Portfólio artístico de StudioNei. Galeria digital de desenhos e pinturas organizada por categorias — retratos, paisagens, anime e mais.",
      },
      { property: "og:title", content: "StudioNei — Galeria de Desenhos e Pinturas" },
      {
        property: "og:description",
        content: "Coleção digital de desenhos e pinturas. Uma galeria minimalista onde a obra é o foco.",
      },
    ],
  }),
  component: Index,
});

type Artwork = {
  id: string;
  title: string;
  technique: string;
  category: string;
  year: number;
  src: string;
};

const artworks: Artwork[] = [
  { id: "1", title: "Montanhas de Névoa", technique: "Lápis Grafite", category: "Paisagem", year: 2026, src: artLandscape },
  { id: "2", title: "Silêncio", technique: "Grafite sobre papel", category: "Retrato", year: 2025, src: artPortrait },
  { id: "3", title: "Hana", technique: "Nanquim e Lápis", category: "Anime", year: 2026, src: artAnime },
  { id: "4", title: "Bosque Dourado", technique: "Óleo sobre tela", category: "Pintura", year: 2024, src: artForest },
  { id: "5", title: "Vento", technique: "Carvão", category: "Animais", year: 2025, src: artHorse },
  { id: "6", title: "Rua de Verão", technique: "Aquarela", category: "Pintura", year: 2026, src: artStreet },
  { id: "7", title: "Íris", technique: "Lápis Grafite", category: "Estudo", year: 2025, src: artEye },
];

const categories = ["Todos", "Paisagem", "Retrato", "Anime", "Pintura", "Animais", "Estudo"];

function Index() {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const filtered = useMemo(
    () =>
      artworks.filter(
        (a) =>
          (category === "Todos" || a.category === category) &&
          (query === "" ||
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.technique.toLowerCase().includes(query.toLowerCase()) ||
            a.category.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, category],
  );

  const openLightbox = (id: string) => {
    const idx = filtered.findIndex((a) => a.id === id);
    setLightbox(idx >= 0 ? idx : 0);
  };

  const nav = (dir: 1 | -1) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + filtered.length) % filtered.length);
  };

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, filtered.length]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <a href="#top" className="flex items-center gap-2 min-w-0">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)]" />
            <span className="font-display text-2xl tracking-wide truncate">
              Studio<span className="text-sky-400">Nei</span>
            </span>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border border-border/50 w-64">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar obra..."
                className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-full hover:bg-muted/60 transition"
              aria-label="Alternar tema"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMenuOpen((m) => !m)}
              className="p-2 rounded-full hover:bg-muted/60 transition"
              aria-label="Categorias"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-t border-border/40 bg-background/95 backdrop-blur"
            >
              <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      setMenuOpen(false);
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm border transition ${
                      category === c
                        ? "border-sky-400 text-sky-400 shadow-[0_0_18px_rgba(56,155,255,0.35)]"
                        : "border-border/60 hover:border-sky-400/60"
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <div className="flex md:hidden items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border border-border/50 w-full mt-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar obra..."
                    className="bg-transparent outline-none text-sm w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section id="top" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={hero} alt="Galeria StudioNei" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-sky-400" />
              <span className="uppercase tracking-[0.4em] text-xs text-sky-400/90">
                Portfólio artístico
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] font-light">
              Seu talento merece <em className="text-sky-400 not-italic italic">uma galeria</em>.
            </h1>
            <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Organize, apresente e compartilhe seus desenhos e pinturas de forma
              profissional. Uma coleção digital onde a obra é o foco.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#gallery"
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-sky-400 text-slate-950 rounded-full font-medium hover:shadow-[0_0_40px_rgba(56,155,255,0.55)] transition-shadow"
              >
                Explorar Obras
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-border rounded-full hover:border-sky-400/60 transition"
              >
                Adicionar Foto
              </a>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          scroll
        </div>
      </section>

      {/* Featured */}
      <section id="gallery" className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-sky-400" />
              <span className="uppercase tracking-[0.3em] text-xs text-sky-400/90">Destaques</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-light">Coleção em Destaque</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider border transition ${
                  category === c
                    ? "border-sky-400 text-sky-400 bg-sky-400/5"
                    : "border-border/60 text-muted-foreground hover:border-sky-400/60 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {filtered.map((a, i) => (
            <motion.button
              key={a.id}
              onClick={() => openLightbox(a.id)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: (i % 6) * 0.05 }}
              className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border/50 bg-card text-left transition-all duration-500 hover:border-sky-400/70 hover:shadow-[0_0_0_1px_rgba(56,155,255,0.4),0_20px_60px_-15px_rgba(56,155,255,0.4)]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={a.src}
                  alt={a.title}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-x-0 bottom-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-white min-w-0">
                      <p className="font-display text-xl truncate">{a.title}</p>
                      <p className="text-xs text-white/70 uppercase tracking-widest mt-1">
                        {a.category} · {a.year}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-400 text-slate-950 text-xs rounded-full font-medium">
                      <Eye className="h-3 w-3" /> Visualizar
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-border/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.technique}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{a.year}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            Nenhuma obra encontrada.
          </div>
        )}
      </section>

      {/* About */}
      <section id="about" className="border-t border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-sky-400/10 blur-2xl" />
            <img
              src={artist}
              alt="Retrato do artista"
              loading="lazy"
              className="relative rounded-2xl border border-sky-400/30 w-full aspect-square object-cover shadow-[0_0_60px_-15px_rgba(56,155,255,0.4)]"
            />
          </motion.div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-sky-400" />
              <span className="uppercase tracking-[0.3em] text-xs text-sky-400/90">Sobre</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-light mb-6">O Artista</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-4">
              StudioNei nasce do encontro entre técnica clássica e sensibilidade
              contemporânea. Cada obra é um exercício de observação — luz,
              textura e silêncio traduzidos em grafite, carvão e tinta.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Formado em artes visuais, dedico-me há mais de uma década ao desenho
              realista, à pintura a óleo e à ilustração. Este espaço reúne
              trabalhos autorais e séries em andamento.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 max-w-md">
              {[
                ["120+", "Obras"],
                ["10", "Anos"],
                ["7", "Coleções"],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-3xl text-sky-400">{n}</p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)]" />
              <span className="font-display text-2xl">
                Studio<span className="text-sky-400">Nei</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Galeria digital de desenhos e pinturas. Uma coleção minimalista onde
              a obra é o foco principal.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Redes</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="inline-flex items-center gap-2 hover:text-sky-400 transition">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </li>
              <li>
                <a href="#" className="inline-flex items-center gap-2 hover:text-sky-400 transition">
                  <Play className="h-4 w-4 rotate-90" /> Behance
                </a>
              </li>
              <li>
                <a href="#" className="inline-flex items-center gap-2 hover:text-sky-400 transition">
                  <Mail className="h-4 w-4" /> contato@studionei.art
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Newsletter</p>
            <p className="text-sm text-muted-foreground mb-4">
              Receba novas obras e coleções direto no seu email.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 bg-muted/50 border border-border/60 rounded-full px-4 py-2 text-sm outline-none focus:border-sky-400 transition"
              />
              <button className="px-4 py-2 bg-sky-400 text-slate-950 rounded-full text-sm font-medium hover:shadow-[0_0_20px_rgba(56,155,255,0.5)] transition">
                Assinar
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} StudioNei · Todos os direitos reservados
        </div>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && filtered[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nav(-1);
              }}
              className="absolute left-4 md:left-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nav(1);
              }}
              className="absolute right-4 md:right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
              aria-label="Próxima"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <motion.div
              key={filtered[lightbox].id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl w-full flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl overflow-hidden border border-sky-400/30 shadow-[0_0_80px_-10px_rgba(56,155,255,0.5)] max-h-[75vh]">
                <img
                  src={filtered[lightbox].src}
                  alt={filtered[lightbox].title}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
              <div className="text-center text-white">
                <p className="font-display text-3xl md:text-4xl">{filtered[lightbox].title}</p>
                <p className="text-sm text-white/60 uppercase tracking-[0.3em] mt-3">
                  {filtered[lightbox].technique} · {filtered[lightbox].category} · {filtered[lightbox].year}
                </p>
                <div className="mt-5 flex justify-center gap-2 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10">
                    <ZoomIn className="h-3 w-3" /> Zoom
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10">
                    <Maximize2 className="h-3 w-3" /> Tela cheia
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10">
                    <Play className="h-3 w-3" /> Slideshow
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

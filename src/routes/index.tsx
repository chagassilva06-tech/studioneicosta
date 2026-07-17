import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Lightbulb,
  LightbulbOff,
  Instagram,
  Mail,
  ChevronRight,
  Play,
  ImageIcon,
} from "lucide-react";


import hero from "@/assets/hero.jpg";
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
        content: "Portfólio artístico de StudioNei. Galeria digital de desenhos e pinturas organizada por categorias — retratos, paisagens, anime e mais.",
      },
    ],
  }),
  component: Index,
});

const categories = ["Paisagem", "Retrato", "Anime", "Pintura", "Animais", "Estudo"];

const searchSuggestions = [
  "Paisagem",
  "Retrato",
  "Anime",
  "Pintura",
  "Animais",
  "Estudo",
  "Aquarela",
  "Óleo sobre tela",
  "Lápis grafite",
  "Nanquim",
  "Carvão",
];

function Index() {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(true);
  const [showSuggest, setShowSuggest] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const suggestions = query
    ? searchSuggestions.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase()),
      )
    : searchSuggestions;

  const submitSearch = (term: string) => {
    const match = categories.find(
      (c) => c.toLowerCase() === term.toLowerCase(),
    );
    if (match) {
      navigate({
        to: "/galeria/$categoria",
        params: { categoria: match },
      });
    }
    setShowSuggest(false);
  };

  const featured = Array.from({ length: 3 });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40 shadow-[0_4px_18px_-6px_rgba(56,155,255,0.35)]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <a href="#top" className="group flex items-center gap-2 min-w-0 transition-transform duration-300 hover:scale-[1.015]">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)] group-hover:shadow-[0_0_16px_rgba(56,155,255,1)] transition-shadow" />
            <span className="font-display text-3xl md:text-4xl tracking-wide truncate drop-shadow-[0_0_10px_rgba(56,155,255,0.45)] transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(56,155,255,0.6)]">
              Studio<span className="text-sky-300 font-normal drop-shadow-[0_0_12px_rgba(56,155,255,0.7)] group-hover:text-sky-200 group-hover:drop-shadow-[0_0_14px_rgba(56,155,255,0.8)]">Nei</span>
            </span>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">


            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-full border-2 border-sky-400/70 bg-sky-400/5 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.85)] hover:border-sky-300 transition-all"
              aria-label="Alternar tema"
            >
              {dark ? <Lightbulb className="h-4 w-4 text-sky-400" /> : <LightbulbOff className="h-4 w-4 text-sky-400" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative border-t border-sky-400/30 bg-background/95 backdrop-blur shadow-[inset_0_1px_0_rgba(186,230,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.35),0_10px_28px_-10px_rgba(56,155,255,0.5)]"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-px h-[2px] bg-[linear-gradient(90deg,transparent,rgba(56,155,255,0.8),transparent)] animate-neon-slide bg-[length:200%_100%]" />
              <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-wrap gap-3">
                {categories.map((c) => (
                  <Link
                    key={c}
                    to="/galeria/$categoria"
                    params={{ categoria: c }}
                    className="group relative px-8 py-2.5 min-w-[140px] text-center rounded-full text-base md:text-lg font-medium tracking-wide border-2 border-sky-400/50 text-foreground bg-background/40 shadow-[0_0_10px_rgba(56,155,255,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-sky-300 hover:text-sky-300 hover:shadow-[0_0_22px_rgba(56,155,255,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10">{c}</span>
                    <span className="pointer-events-none absolute left-2 right-2 bottom-1 h-[2px] rounded-full animate-neon-line opacity-70 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


      </header>


      {/* Hero */}
      <section id="top" className="relative min-h-screen flex items-center overflow-hidden pt-32">
        <div className="absolute inset-0">
          <img src={hero} alt="Galeria StudioNei" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div className="absolute inset-0 animate-hero-light" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-sky-400" />
              <span className="uppercase tracking-[0.4em] text-xs text-sky-300">
                Portfólio artístico
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] font-light text-foreground drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)]">
              Seu talento merece{" "}
              <span className="text-shimmer italic font-normal">uma galeria</span>.
            </h1>
            <p className="mt-8 text-base md:text-lg text-foreground/85 max-w-lg leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]">
              Organize, apresente e compartilhe seus desenhos e pinturas de forma
              profissional. Uma coleção digital onde a obra é o foco.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#gallery"
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-sky-400 text-slate-950 rounded-full font-medium border-2 border-sky-400 shadow-[0_0_0_rgba(56,155,255,0)] hover:bg-sky-300 hover:border-sky-200 hover:shadow-[0_0_28px_rgba(56,155,255,0.85),0_0_60px_rgba(56,155,255,0.55)] transition-all duration-300"
              >
                Explorar Obras
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#about"
                className="group inline-flex items-center gap-2 px-8 py-3.5 border-2 border-sky-400/40 text-foreground rounded-full hover:border-sky-300 hover:text-sky-200 hover:shadow-[0_0_22px_rgba(56,155,255,0.7)] hover:bg-sky-400/5 transition-all duration-300"
              >
                Sobre o Artista
              </a>
            </div>
            <div className="mt-8 relative max-w-md">
              <div className="flex items-center gap-2 bg-background/70 backdrop-blur-xl rounded-full px-4 py-3 border-2 border-sky-400/80 shadow-[0_0_28px_rgba(56,155,255,0.45)] transition focus-within:border-sky-300 focus-within:shadow-[0_0_36px_rgba(56,155,255,0.75)]">
                <Search className="h-4 w-4 text-sky-300 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggest(true);
                  }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch(query);
                  }}
                  placeholder="Buscar categoria ou técnica..."
                  className="bg-transparent outline-none text-sm w-full text-foreground placeholder:text-foreground/60"
                />
                {query && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery("");
                    }}
                    className="text-xs text-sky-300/80 hover:text-sky-200 px-1"
                    aria-label="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>
              <AnimatePresence>
                {showSuggest && suggestions.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-background/95 backdrop-blur-xl border-2 border-sky-400/60 rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(56,155,255,0.55)] py-2 z-50 max-h-72 overflow-y-auto"
                  >
                    <li className="px-4 pb-1 text-[10px] uppercase tracking-[0.3em] text-sky-300/80">
                      {query ? "Sugestões" : "Categorias e técnicas"}
                    </li>
                    {suggestions.slice(0, 8).map((s) => {
                      const isCategory = categories.includes(s);
                      const idx = s.toLowerCase().indexOf(query.toLowerCase());
                      return (
                        <li key={s}>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setQuery(s);
                              submitSearch(s);
                            }}
                            className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm text-foreground hover:bg-sky-400/15 hover:text-sky-200 transition group"
                          >
                            <Search className="h-3.5 w-3.5 text-sky-400/70 group-hover:text-sky-300" />
                            <span className="flex-1">
                              {query && idx >= 0 ? (
                                <>
                                  {s.slice(0, idx)}
                                  <span className="text-sky-300 font-medium">
                                    {s.slice(idx, idx + query.length)}
                                  </span>
                                  {s.slice(idx + query.length)}
                                </>
                              ) : (
                                s
                              )}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-foreground/50 group-hover:text-sky-300/80">
                              {isCategory ? "Categoria" : "Técnica"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

      </section>

      {/* Featured */}
      <section id="gallery" className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-sky-400" />
              <span className="uppercase tracking-[0.3em] text-xs text-sky-400/90">Destaques</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-light">Coleção em Destaque</h2>
          </div>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: (i % 6) * 0.08 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:border-sky-400/70 hover:shadow-[0_0_0_1px_rgba(56,155,255,0.4),0_20px_60px_-15px_rgba(56,155,255,0.4)]"
            >
              <div
                className="absolute inset-0 animate-glow-pulse"
                style={{ animationDelay: `${i * 0.6}s` }}
              />
              <div className="relative h-full w-full flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="p-4 rounded-full bg-sky-400/10 border border-sky-400/20 group-hover:border-sky-400/60 transition">
                  <ImageIcon className="h-6 w-6 text-sky-400/80" />
                </div>
                <div>
                  <p className="font-display text-2xl">Em breve</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-2">
                    Receberá fotos em breve
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-sky-400/10 blur-2xl transition-all duration-500 group-hover:bg-sky-400/25 group-hover:-inset-6" />
            <img
              src={artist}
              alt="Retrato do artista"
              loading="lazy"
              className="relative rounded-2xl border border-sky-400/30 w-full aspect-square object-cover shadow-[0_0_60px_-15px_rgba(56,155,255,0.4)] transition-all duration-500 group-hover:scale-[1.03] group-hover:border-sky-300 group-hover:shadow-[0_0_80px_-10px_rgba(56,155,255,0.75)]"
            />
          </motion.div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-sky-400" />
              <span className="uppercase tracking-[0.3em] text-xs text-sky-400/90">Sobre</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-light mb-6">O Artista</h2>
            <p className="text-foreground/85 leading-relaxed text-lg mb-4">
              StudioNei nasce do encontro entre técnica clássica e sensibilidade
              contemporânea. Cada obra é um exercício de observação — luz,
              textura e silêncio traduzidos em grafite, carvão e tinta.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sky-400/30 bg-background/80 shadow-[inset_0_1px_0_rgba(186,230,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.5),0_-10px_28px_-14px_rgba(56,155,255,0.5)]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)]" />
              <span className="font-display text-3xl md:text-4xl drop-shadow-[0_0_10px_rgba(56,155,255,0.45)]">
                Studio<span className="text-sky-300 font-normal drop-shadow-[0_0_12px_rgba(56,155,255,0.7)]">Nei</span>
              </span>
            </div>
            <p className="text-sm text-foreground/75 max-w-xs leading-relaxed">
              Galeria digital de desenhos e pinturas. Uma coleção minimalista onde
              a obra é o foco principal.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300/90 mb-4">Redes</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="inline-flex items-center gap-2 hover:text-sky-300 transition">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </li>
              <li>
                <a href="#" className="inline-flex items-center gap-2 hover:text-sky-300 transition">
                  <Play className="h-4 w-4 rotate-90" /> Behance
                </a>
              </li>
              <li>
                <a href="#" className="inline-flex items-center gap-2 hover:text-sky-300 transition">
                  <Mail className="h-4 w-4" /> contato@studionei.art
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sky-400/20 py-6 text-center text-xs text-foreground/70 shadow-[inset_0_1px_0_rgba(186,230,255,0.2)]">
          © {new Date().getFullYear()} StudioNei · Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
}

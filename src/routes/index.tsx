import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Lightbulb,
  LightbulbOff,
  Instagram,
  Mail,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  ImageIcon,
} from "lucide-react";


import hero from "@/assets/hero.jpg";
import artist from "@/assets/artist.png";
import paisagem1 from "@/assets/paisagem-1.png";
import pintura1 from "@/assets/pintura-1.png";
import artPortrait from "@/assets/art-portrait.jpg";
import artAnime from "@/assets/art-anime.jpg";
import artHorse from "@/assets/art-horse.jpg";
import artForest from "@/assets/art-forest.jpg";

const featuredSlides = [
  { src: paisagem1, title: "Paisagem", categoria: "Paisagem" },
  { src: pintura1, title: "Pintura", categoria: "Pintura" },
  { src: artPortrait, title: "Retrato", categoria: "Retrato" },
  { src: artAnime, title: "Anime", categoria: "Anime" },
  { src: artHorse, title: "Animais", categoria: "Animais" },
  { src: artForest, title: "Estudo", categoria: "Estudo" },
];

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

  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [featuredPlaying, setFeaturedPlaying] = useState(true);
  const [featuredHover, setFeaturedHover] = useState(false);
  const featuredTotal = featuredSlides.length;

  useEffect(() => {
    if (!featuredPlaying || featuredHover) return;
    const t = setInterval(() => {
      setFeaturedIdx((i) => (i + 1) % featuredTotal);
    }, 5000);
    return () => clearInterval(t);
  }, [featuredPlaying, featuredHover, featuredTotal]);

  const nextFeatured = () => setFeaturedIdx((i) => (i + 1) % featuredTotal);
  const prevFeatured = () =>
    setFeaturedIdx((i) => (i - 1 + featuredTotal) % featuredTotal);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40 shadow-[0_4px_18px_-6px_rgba(56,155,255,0.35)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-16 grid grid-cols-3 items-center gap-2 sm:gap-4">
          <div />
          <a href="#top" className="group justify-self-center flex items-center gap-2 min-w-0 transition-transform duration-300 hover:scale-[1.015]">
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)] group-hover:shadow-[0_0_16px_rgba(56,155,255,1)] transition-shadow" />
            <span className="font-display text-xl sm:text-2xl md:text-4xl tracking-wide truncate drop-shadow-[0_0_10px_rgba(56,155,255,0.45)] transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(56,155,255,0.6)]">
              Studio<span className="text-sky-300 font-normal drop-shadow-[0_0_12px_rgba(56,155,255,0.7)] group-hover:text-sky-200 group-hover:drop-shadow-[0_0_14px_rgba(56,155,255,0.8)]">Nei</span>
            </span>
          </a>

          <div className="justify-self-end flex items-center gap-2 sm:gap-4">
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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-4 flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3">
                {categories.map((c) => (
                  <Link
                    key={c}
                    to="/galeria/$categoria"
                    params={{ categoria: c }}
                    className="group relative px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 min-w-[100px] sm:min-w-[130px] text-center rounded-full text-sm sm:text-base md:text-lg font-medium tracking-wide border-2 border-sky-400/50 text-foreground bg-background/40 shadow-[0_0_10px_rgba(56,155,255,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-sky-300 hover:text-sky-300 hover:shadow-[0_0_22px_rgba(56,155,255,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span className="relative z-10">{c}</span>
                  </Link>
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>


      </header>


      {/* Hero */}
      <section id="top" className="relative min-h-screen flex items-center overflow-hidden pt-40 sm:pt-36 md:pt-32">
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
            className="max-w-none"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-sky-400" />
              <span className="uppercase tracking-[0.4em] text-xs text-sky-300">
                Portfólio artístico
              </span>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-8 animate-glow-pulse rounded-3xl" />
              <h1 className="relative font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] font-light text-foreground drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] text-left whitespace-nowrap">
                Seu talento merece{" "}
                <span className="text-shimmer italic font-normal">uma galeria</span>.
              </h1>

              <p className="relative mt-8 text-base md:text-lg text-foreground/85 max-w-lg leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]">
                Organize, apresente e compartilhe seus desenhos e pinturas de forma
                profissional. Uma coleção digital onde a obra é o foco.
              </p>
            </div>
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
                  <>
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
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        submitSearch(query);
                      }}
                      className="ml-1 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/70 text-sky-200 text-xs font-medium hover:bg-sky-400/20 hover:text-sky-100 hover:shadow-[0_0_18px_rgba(56,155,255,0.7)] transition-all"
                      aria-label="Buscar"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Buscar
                    </button>
                  </>
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



        <div
          className="relative"
          onMouseEnter={() => setFeaturedHover(true)}
          onMouseLeave={() => setFeaturedHover(false)}
        >
          <div className="relative aspect-[16/9] sm:aspect-[16/8] overflow-hidden rounded-2xl border border-border/50 bg-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={featuredIdx}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img
                  src={featuredSlides[featuredIdx].src}
                  alt={featuredSlides[featuredIdx].title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-300/90 mb-2">
                    Destaque {featuredIdx + 1} / {featuredTotal}
                  </p>
                  <h3 className="font-display text-3xl md:text-4xl">
                    {featuredSlides[featuredIdx].title}
                  </h3>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-sky-400/70 shadow-[inset_0_0_12px_rgba(56,189,248,0.55),0_0_14px_rgba(56,189,248,0.5)]" />

            {/* Prev / Next */}
            <button
              onClick={prevFeatured}
              aria-label="Anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full border-2 border-sky-400/70 bg-background/50 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.85)] hover:border-sky-300 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextFeatured}
              aria-label="Próximo"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full border-2 border-sky-400/70 bg-background/50 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.85)] hover:border-sky-300 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => setFeaturedPlaying((p) => !p)}
              aria-label={featuredPlaying ? "Pausar" : "Reproduzir"}
              className="absolute top-4 right-4 p-2.5 rounded-full border-2 border-sky-400/70 bg-background/50 backdrop-blur text-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.5)] hover:shadow-[0_0_22px_rgba(56,155,255,0.85)] hover:border-sky-300 transition-all"
            >
              {featuredPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>

          {/* Indicators */}
          <div className="mt-5 flex justify-center gap-2.5">
            {featuredSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setFeaturedIdx(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-2.5 rounded-full border-2 transition-all duration-300 ${
                  i === featuredIdx
                    ? "w-8 bg-sky-400 border-sky-300 shadow-[0_0_14px_rgba(56,155,255,0.85)]"
                    : "w-2.5 border-sky-400/50 bg-transparent hover:border-sky-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border/40 bg-muted/20">
        <div className="max-w-5xl mx-auto pl-2 pr-6 sm:pl-4 sm:pr-8 md:pl-2 md:pr-10 py-8 grid md:grid-cols-[220px_1fr] gap-8 md:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group relative justify-self-start w-full max-w-[220px] md:-ml-2"
          >

            <div className="absolute -inset-4 rounded-3xl bg-sky-400/10 blur-2xl transition-all duration-500 group-hover:bg-sky-400/25 group-hover:-inset-6" />
            <img
              src={artist}
              alt="Retrato do artista"
              loading="lazy"
              className="relative rounded-full border-2 border-sky-400/40 w-full aspect-square object-cover shadow-[0_0_60px_-15px_rgba(56,155,255,0.5)] transition-all duration-500 group-hover:scale-[1.03] group-hover:border-sky-300 group-hover:shadow-[0_0_80px_-10px_rgba(56,155,255,0.85)]"
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

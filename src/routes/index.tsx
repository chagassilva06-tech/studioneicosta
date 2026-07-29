import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Mail,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  ImageIcon,
  LogOut,
  Search,
  LayoutGrid,
  Mountain,
  User as UserIcon,
  Palette,
  Sparkles,
  PawPrint,
  BookOpen,
} from "lucide-react";



import hero from "@/assets/hero.jpg";
import artist from "@/assets/artist.webp";
import paisagem1 from "@/assets/paisagem-1.webp";
import pintura1 from "@/assets/pintura-1.webp";
import artPortrait from "@/assets/art-portrait.jpg";
import artAnime from "@/assets/art-anime.jpg";
import artHorse from "@/assets/art-horse.jpg";
import artForest from "@/assets/art-forest.jpg";

import type { LightboxData } from "@/components/Lightbox";
const Lightbox = lazy(() => import("@/components/Lightbox").then((m) => ({ default: m.Lightbox })));
const StackedCarousel = lazy(() =>
  import("@/components/StackedCarousel").then((m) => ({ default: m.StackedCarousel })),
);
import { supabase } from "@/integrations/supabase/client";
import { useDominantColor, rgbTriplet } from "@/hooks/use-dominant-color";
import { useIsMobile } from "@/hooks/use-mobile";

const featuredSlides = [
  {
    src: paisagem1,
    title: "Paisagem",
    categoria: "Paisagem",
    description:
      "Estudo de paisagem explorando luz natural, profundidade e atmosfera. Composição pensada para transmitir serenidade e a força silenciosa do ambiente retratado.",
  },
  {
    src: pintura1,
    title: "Pintura",
    categoria: "Pintura",
    description:
      "Obra em técnica mista, com camadas de cor trabalhadas para revelar textura, contraste e movimento. Cada pincelada compõe o gesto e a expressão da peça.",
  },
  {
    src: artPortrait,
    title: "Retrato",
    categoria: "Retrato",
    description:
      "Retrato realista com foco em expressão do olhar, volume da luz sobre a pele e traços humanos autênticos.",
  },
  {
    src: artAnime,
    title: "Anime",
    categoria: "Anime",
    description:
      "Ilustração de estilo anime com linhas limpas, sombreamento estilizado e paleta vibrante.",
  },
  {
    src: artHorse,
    title: "Animais",
    categoria: "Animais",
    description:
      "Estudo de anatomia animal, atenção à textura do pelo, olhar atento e postura em movimento.",
  },
  {
    src: artForest,
    title: "Estudo",
    categoria: "Estudo",
    description:
      "Estudo técnico exploratório — proporção, luz e forma. Base para obras futuras da coleção.",
  },
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

const categories: { name: string; icon: typeof Mountain }[] = [
  { name: "Paisagem", icon: Mountain },
  { name: "Retrato", icon: UserIcon },
  { name: "Anime", icon: Sparkles },
  { name: "Pintura", icon: Palette },
  { name: "Animais", icon: PawPrint },
  { name: "Estudo", icon: BookOpen },
];


function Index() {
  const [menuOpen, setMenuOpen] = useState(true);
  const isMobile = useIsMobile();

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && !data.session) {
        navigate({ to: "/auth", replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const [featuredIdx, setFeaturedIdx] = useState(0);

  const [featuredPlaying, setFeaturedPlaying] = useState(true);
  const [featuredHover, setFeaturedHover] = useState(false);
  const [featuredDir, setFeaturedDir] = useState(1);
  const [lightbox, setLightbox] = useState<LightboxData>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.from("artworks").select("categoria").then(({ data }) => {
      if (cancelled || !data) return;
      const c: Record<string, number> = {};
      for (const r of data as { categoria: string }[]) {
        c[r.categoria] = (c[r.categoria] ?? 0) + 1;
      }
      setCounts(c);
    });
    return () => { cancelled = true; };
  }, []);

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const suggestions = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const featuredTotal = featuredSlides.length;

  const [featuredUrls, setFeaturedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("artworks")
        .select("categoria, slot, storage_path")
        .order("slot", { ascending: true });
      if (!data || cancelled) return;
      const firstByCat: Record<string, string> = {};
      for (const row of data) {
        if (!firstByCat[row.categoria]) firstByCat[row.categoria] = row.storage_path;
      }
      const entries = Object.entries(firstByCat);
      if (!entries.length) return;
      const paths = entries.map(([, p]) => p);
      const signed = await Promise.all(
        paths.map((p) =>
          supabase.storage
            .from("artworks")
            .createSignedUrl(p, 60 * 60 * 24 * 365, {
              transform: { width: 900, quality: 78, resize: "contain" },
            }),
        ),
      );
      if (cancelled) return;
      const urlByCat: Record<string, string> = {};
      entries.forEach(([cat], i) => {
        const s = signed[i]?.data;
        if (s?.signedUrl) urlByCat[cat] = s.signedUrl;
      });
      setFeaturedUrls(urlByCat);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentSlide = featuredSlides[featuredIdx];
  const currentSrc = featuredUrls[currentSlide.categoria] ?? currentSlide.src;
  const featuredDominant = useDominantColor(currentSrc);
  const featuredTriplet = rgbTriplet(featuredDominant) ?? "56, 189, 248";
  const featuredColor = featuredDominant ?? "rgb(56, 189, 248)";

  useEffect(() => {
    if (!featuredPlaying || featuredHover) return;
    const t = setInterval(() => {
      setFeaturedDir(1);
      setFeaturedIdx((i) => (i + 1) % featuredTotal);
    }, 5000);
    return () => clearInterval(t);
  }, [featuredPlaying, featuredHover, featuredTotal]);

  const nextFeatured = () => {
    setFeaturedDir(1);
    setFeaturedIdx((i) => (i + 1) % featuredTotal);
  };
  const prevFeatured = () => {
    setFeaturedDir(-1);
    setFeaturedIdx((i) => (i - 1 + featuredTotal) % featuredTotal);
  };
  const goFeatured = (i: number) => {
    setFeaturedDir(i > featuredIdx ? 1 : -1);
    setFeaturedIdx(i);
  };

  return (
    <div className="min-h-screen bg-background bg-canvas-texture text-foreground font-sans transition-colors duration-500">
      {/* Editorial signature bar (22px) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[22px] flex items-center justify-center bg-background/90 backdrop-blur-md border-b border-[#d8bf85]/15">
        <span className="label-luxe text-[0.55rem] tracking-[0.55em]">Arte · Pintura · Projetos Autorais</span>
      </div>

      {/* Header (sticky, layered) */}
      <header className="fixed top-[22px] left-0 right-0 z-40 backdrop-blur-xl bg-background/80">
        {/* Logo row — 70px */}
        <div className="h-[70px] max-w-7xl mx-auto px-4 sm:px-6 md:px-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div />
          <a
            href="#top"
            className="group justify-self-center flex items-center gap-2 min-w-0 transition-transform duration-200 hover:scale-[1.04]"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#b89a5e] shadow-[0_0_10px_rgba(184,154,94,0.7)] group-hover:shadow-[0_0_14px_rgba(216,191,133,0.9)] transition-shadow" />
            <span
              className="font-display text-[1.6rem] sm:text-3xl md:text-[2.4rem] leading-none tracking-wide truncate text-foreground transition-all duration-300 group-hover:tracking-[0.05em]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Studio
              <span className="italic font-normal text-[#d8bf85] drop-shadow-[0_0_10px_rgba(216,191,133,0.5)] group-hover:drop-shadow-[0_0_14px_rgba(216,191,133,0.75)]">
                Nei
              </span>
            </span>
          </a>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            aria-label="Sair"
            title="Sair"
            className="justify-self-end inline-flex items-center justify-center h-9 w-9 rounded-full text-sky-300 border border-sky-400/50 bg-sky-400/[0.06] hover:bg-sky-400/15 hover:border-sky-300 hover:text-sky-100 hover:shadow-[0_0_16px_rgba(56,155,255,0.7)] transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Categories pills — 60px */}
        <div className="h-[60px] border-t border-sky-400/15 bg-background/60">
          <div
            className="max-w-7xl mx-auto h-full px-3 sm:px-6 md:px-10 flex items-center gap-2 sm:gap-2.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <a
              href="#gallery"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-sky-400 text-slate-950 border border-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.6)] hover:shadow-[0_0_26px_rgba(56,189,248,0.9)] transition-all duration-200 hover:scale-[1.05]"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Todos
              <span className="opacity-80 text-[10px] sm:text-xs">({totalCount})</span>
            </a>
            {categories.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                to="/galeria/$categoria"
                params={{ categoria: name }}
                className="shrink-0 group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-foreground/85 border border-sky-400/40 bg-transparent hover:bg-sky-400/10 hover:border-sky-300 hover:text-sky-100 hover:shadow-[0_0_14px_rgba(56,155,255,0.6)] transition-all duration-200 hover:scale-[1.05]"
              >
                <Icon className="h-3.5 w-3.5 text-sky-300/85 group-hover:text-sky-200" />
                {name}
                <span className="opacity-60 text-[10px] sm:text-xs">({counts[name] ?? 0})</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="border-t border-sky-400/10 bg-background/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-300/70" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Pesquisar obras..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-background/70 border border-sky-400/40 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-sky-300 focus:shadow-[0_0_16px_rgba(56,155,255,0.55)] transition-all"
              />
            </div>
            {searchFocused && suggestions.length > 0 && (
              <div className="absolute left-4 right-4 sm:left-6 sm:right-6 mt-1 rounded-xl border border-sky-400/40 bg-background/95 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(56,155,255,0.5)] overflow-hidden z-10 animate-fade-in">
                {suggestions.map(({ name, icon: Icon }) => (
                  <Link
                    key={name}
                    to="/galeria/$categoria"
                    params={{ categoria: name }}
                    onClick={() => setQuery("")}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-sky-400/10 hover:text-sky-100 transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 text-sky-300/85" />
                    {name}
                    <span className="ml-auto text-xs text-muted-foreground">
                      ({counts[name] ?? 0})
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Neon gradient separator */}
        <div className="h-[3px] bg-[linear-gradient(90deg,transparent,rgba(56,155,255,0.75),transparent)] shadow-[0_10px_24px_-6px_rgba(56,155,255,0.7)]" />
      </header>

      {/* Hero */}
      <section id="top" className="relative min-h-screen flex items-center overflow-hidden pt-56 sm:pt-52 md:pt-48">

        <div className="absolute inset-0">
          <img src={hero} alt="Galeria StudioNei" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div className="absolute inset-0 animate-hero-light" />
          <div className="absolute inset-0 vignette-museum" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-12 sm:py-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-none"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="rule-gold w-16" />
              <span className="label-luxe">Portfólio Artístico</span>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-8 animate-glow-pulse rounded-3xl" />
              <h1 className="relative font-display text-[1.6rem] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-light text-foreground drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] text-left break-words tracking-[0.005em] animate-title-glow-subtle">
                Seu talento merece{" "}
                <span className="text-shimmer italic font-normal">uma galeria</span>.
              </h1>
              <p className="relative mt-4 font-display italic text-lg md:text-xl text-[#d8bf85]/85 drop-shadow-[0_0_14px_rgba(216,191,133,0.35)]">
                "Onde cada parede se transforma em arte."
              </p>

              <p className="relative mt-6 text-base md:text-lg text-foreground/85 max-w-lg leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]">
                Organize, apresente e compartilhe seus desenhos e pinturas de forma
                profissional. Uma coleção digital onde a obra é o foco.
              </p>
            </div>
            <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
              <a
                href="#gallery"
                className="group relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-sky-400 text-slate-950 rounded-full font-medium text-sm sm:text-base border-2 border-sky-400 shadow-[0_0_0_rgba(56,155,255,0)] hover:bg-sky-300 hover:border-sky-200 hover:shadow-[0_0_28px_rgba(56,155,255,0.85),0_0_60px_rgba(56,155,255,0.55)] transition-all duration-300"
              >
                Explorar Obras
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#about"
                className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-sky-400/40 text-foreground rounded-full text-sm sm:text-base hover:border-sky-300 hover:text-sky-200 hover:shadow-[0_0_22px_rgba(56,155,255,0.7)] hover:bg-sky-400/5 transition-all duration-300"
              >
                Sobre o Artista
              </a>
            </div>

            {/* Gallery title positioned below the action buttons */}
            <div id="gallery" className="relative z-10 text-center pt-6 sm:pt-8 mt-2 sm:mt-4 pb-8 sm:pb-12">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="rule-gold w-10 sm:w-12" />
                <span className="label-luxe">Destaques</span>
                <div className="rule-gold w-10 sm:w-12" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.01em] animate-title-glow-subtle">
                Coleção em <span className="italic text-gold-shimmer">Destaque</span>
              </h2>
            </div>
          </motion.div>
        </div>

      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-6 sm:pt-8 pb-6 sm:pb-10">
        <Suspense fallback={<div className="h-[420px]" />}>
          <StackedCarousel
            slides={featuredSlides}
            urls={featuredUrls}
            pairMode
            onSelect={(slide, src) =>
              setLightbox({
                src,
                title: slide.title,
                description: slide.description,
                categoria: slide.categoria,
              })
            }
          />
        </Suspense>
      </section>


      {/* About */}
      <section id="about" className="border-t border-border/40 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:pl-4 sm:pr-8 md:pl-2 md:pr-10 py-10 sm:py-8 grid md:grid-cols-[220px_1fr] gap-8 md:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group relative justify-self-start w-40 sm:w-48 md:w-full max-w-[220px] md:-ml-2"
          >

            <div className="absolute -inset-4 rounded-3xl bg-sky-400/10 blur-2xl transition-all duration-500 group-hover:bg-sky-400/25 group-hover:-inset-6" />
            <img
              src={artist}
              alt="Retrato do artista"
              loading="lazy"
              decoding="async"
              className="relative rounded-full border-2 border-sky-400/40 w-full aspect-square object-cover shadow-[0_0_60px_-15px_rgba(56,155,255,0.5)] transition-all duration-500 group-hover:scale-[1.03] group-hover:border-sky-300 group-hover:shadow-[0_0_80px_-10px_rgba(56,155,255,0.85)]"
            />
          </motion.div>

          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="rule-gold w-12" />
              <span className="label-luxe">Sobre</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6 tracking-[0.01em] animate-title-glow-subtle">
              O <span className="italic text-gold-shimmer">Artista</span>
            </h2>
            <p className="text-foreground/85 leading-relaxed text-base sm:text-lg mb-4">
              StudioNei nasce do encontro entre técnica clássica e sensibilidade
              contemporânea. Cada obra é um exercício de observação — luz,
              textura e silêncio traduzidos em grafite, carvão e tinta.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sky-400/30 bg-background/80 shadow-[inset_0_1px_0_rgba(186,230,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.5),0_-10px_28px_-14px_rgba(56,155,255,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 grid md:grid-cols-2 gap-8 md:gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b89a5e] shadow-[0_0_10px_rgba(184,154,94,0.7)]" />
              <span className="font-display text-3xl md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Studio<span className="italic font-normal text-[#d8bf85] drop-shadow-[0_0_10px_rgba(216,191,133,0.5)]">Nei</span>
              </span>
            </div>
            <p className="text-sm text-foreground/75 max-w-xs leading-relaxed">
              Galeria digital de desenhos e pinturas. Uma coleção minimalista onde
              a obra é o foco principal.
            </p>
          </div>
          <div>
            <p className="label-luxe mb-4">Redes</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/sidnei_costa1961?igsh=MWFsdWF4NTlsOTJoaA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-sky-300 transition"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </li>
              <li>
                <a
                  href="mailto:costa.sidnei@gmail.com"
                  className="inline-flex items-center gap-2 hover:text-sky-300 transition"
                >
                  <Mail className="h-4 w-4" /> costa.sidnei@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sky-400/20 py-6 text-center text-xs text-foreground/70 shadow-[inset_0_1px_0_rgba(186,230,255,0.2)]">
          © {new Date().getFullYear()} StudioNei · Todos os direitos reservados
        </div>
      </footer>
      <Suspense fallback={null}>
        {lightbox && <Lightbox data={lightbox} onClose={() => setLightbox(null)} />}
      </Suspense>
    </div>
  );

}

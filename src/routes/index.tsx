import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, useMemo, memo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Mail,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  ImageIcon,
  Search,
  LayoutGrid,
  Settings2,
  LogOut,
  LogIn,
  Copy,
  Check,
  X,
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
const CategoryManager = lazy(() =>
  import("@/components/CategoryManager").then((m) => ({ default: m.CategoryManager })),
);
const AllArtworksModal = lazy(() =>
  import("@/components/AllArtworksModal").then((m) => ({ default: m.AllArtworksModal })),
);
import { supabase } from "@/integrations/supabase/client";
import { useDominantColor, rgbTriplet } from "@/hooks/use-dominant-color";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdmin } from "@/hooks/use-admin";
import { getIcon } from "@/lib/category-icons";
import { isGuest, exitGuest } from "@/lib/guest";

const featuredSlides = [
  {
    src: paisagem1,
    title: "Paisagem",
    categoria: "Paisagem",
    pos: 0,
    description:
      "Estudo de paisagem explorando luz natural, profundidade e atmosfera. Composição pensada para transmitir serenidade e a força silenciosa do ambiente retratado.",
  },
  {
    src: pintura1,
    title: "Pintura",
    categoria: "Pintura",
    pos: 0,
    description:
      "Obra em técnica mista, com camadas de cor trabalhadas para revelar textura, contraste e movimento. Cada pincelada compõe o gesto e a expressão da peça.",
  },
  {
    src: artPortrait,
    title: "Retrato",
    categoria: "Retrato",
    pos: 0,
    description:
      "Retrato realista com foco em expressão do olhar, volume da luz sobre a pele e traços humanos autênticos.",
  },
  {
    src: artAnime,
    title: "Anime",
    categoria: "Anime",
    pos: 0,
    description:
      "Ilustração de estilo anime com linhas limpas, sombreamento estilizado e paleta vibrante.",
  },
  {
    src: artHorse,
    title: "Animais",
    categoria: "Animais",
    pos: 0,
    description:
      "Estudo de anatomia animal, atenção à textura do pelo, olhar atento e postura em movimento.",
  },
  {
    src: artForest,
    title: "Estudo",
    categoria: "Estudo",
    pos: 0,
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

type Cat = { id: string; name: string; icon: string; sort_order: number };

const fallbackDescriptions: Record<string, string> = Object.fromEntries(
  featuredSlides.map((s) => [s.categoria, s.description]),
);
const fallbackSrc: Record<string, string> = Object.fromEntries(
  featuredSlides.map((s) => [s.categoria, s.src]),
);

const CategoryScroll = memo(({ categories, counts }: { categories: Cat[], counts: Record<string, number> }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // Filter categories that have artworks
  const activeCategories = useMemo(() => {
    return categories.filter(c => (counts[c.name] ?? 0) > 0);
  }, [categories, counts]);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, activeCategories]);

  const scroll = (dir: 1 | -1) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  return (
    <>
      <AnimatePresence>
        {showLeft && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 items-center justify-center rounded-full bg-background/80 border border-white/10 text-[#d8bf85] backdrop-blur hidden sm:flex hover:bg-white hover:text-slate-950 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
        )}
        {showRight && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 items-center justify-center rounded-full bg-background/80 border border-white/10 text-[#d8bf85] backdrop-blur hidden sm:flex hover:bg-white hover:text-slate-950 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        className="h-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory overscroll-contain"
      >
        <div className="flex items-center gap-2 h-full px-1 pr-10">
          {activeCategories.map((c) => {
            const Icon = getIcon(c.icon);
            return (
              <Link
                key={c.id}
                to="/galeria/$categoria"
                params={{ categoria: c.name }}
                className="shrink-0 snap-start group inline-flex min-h-[38px] items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-foreground/80 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 hover:text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Icon className="h-4 w-4 shrink-0 text-sky-400 group-hover:text-sky-300 transition-colors" />
                <span className="whitespace-nowrap">{c.name}</span>
                <span className="opacity-60 text-[10px] sm:text-xs">({counts[c.name] ?? 0})</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
});


function Index() {
  const isMobile = useIsMobile();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    let active = true;
    if (isGuest()) {
      setGuest(true);
      setAuthChecked(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !isGuest()) navigate({ to: "/auth", replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);






  const [lightbox, setLightbox] = useState<LightboxData>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const queryClient = useQueryClient();

  const openLightbox = useCallback((data: LightboxData) => setLightbox(data), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const openCategoryManager = useCallback(() => setShowCategoryManager(true), []);
  const closeCategoryManager = useCallback(() => setShowCategoryManager(false), []);
  const openAllModal = useCallback(() => setShowAllModal(true), []);
  const closeAllModal = useCallback(() => setShowAllModal(false), []);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Cat[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
  const categories = categoriesQuery.data ?? [];

  const countsQuery = useQuery({
    queryKey: ["artwork-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artworks").select("categoria");
      if (error) throw error;
      const c: Record<string, number> = {};
      for (const r of data as { categoria: string }[]) {
        c[r.categoria] = (c[r.categoria] ?? 0) + 1;
      }
      return c;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
  const counts = countsQuery.data ?? {};

  const featuredUrlsQuery = useQuery({
    queryKey: ["featured-urls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("categoria, slot, storage_path, featured")
        .order("slot", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return {} as Record<string, string[]>;

      const featured: Record<string, string[]> = {};
      for (const row of data as { categoria: string; storage_path: string; featured: boolean }[]) {
        if (row.featured) {
          featured[row.categoria] = [row.storage_path];
        }
      }

      const byCat: Record<string, string[]> = {};
      for (const row of data as { categoria: string; storage_path: string }[]) {
        const arr = byCat[row.categoria] ?? (byCat[row.categoria] = []);
        if (arr.length < 2) arr.push(row.storage_path);
      }
      for (const cat of Object.keys(byCat)) {
        if (featured[cat]) {
          const rest = byCat[cat].filter((p) => p !== featured[cat][0]);
          byCat[cat] = [...featured[cat], ...rest].slice(0, 2);
        }
      }

      const entries = Object.entries(byCat).flatMap(([cat, paths]) =>
        paths.map((path) => [cat, path] as [string, string]),
      );
      if (!entries.length) return {} as Record<string, string[]>;
      const signed = await Promise.all(
        entries.map(([, p]) =>
          supabase.storage
            .from("artworks")
            .createSignedUrl(p, 60 * 60 * 24 * 365, {
              transform: { width: 900, quality: 78, resize: "contain" },
            }),
        ),
      );
      const urlByCat: Record<string, string[]> = {};
      entries.forEach(([cat], i) => {
        const s = signed[i]?.data;
        if (s?.signedUrl) {
          const arr = urlByCat[cat] ?? (urlByCat[cat] = []);
          arr.push(s.signedUrl);
        }
      });
      return urlByCat;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (signed URLs last 1 year)
    refetchOnWindowFocus: false,
  });
  const featuredUrls = featuredUrlsQuery.data ?? {};

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const suggestions = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  // Build slides: fetch the first two items per category for the carousel
  const slides = useMemo(() => {
    return categories.flatMap((c) => {
      const urls = featuredUrls[c.name] ?? [];
      const base = {
        title: c.name,
        categoria: c.name,
        description: fallbackDescriptions[c.name] ?? `Obra da coleção ${c.name}.`,
      };
      
      // Return 2 slides per category
      return [
        { ...base, src: urls[0] ?? fallbackSrc[c.name] ?? paisagem1, pos: 0 },
        { ...base, src: urls[1] ?? fallbackSrc[c.name] ?? pintura1, pos: 1 },
      ];
    });
  }, [categories, featuredUrls]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background bg-canvas-texture flex items-center justify-center">
        <span className="label-luxe text-[0.6rem] tracking-[0.5em] text-[#d8bf85]/70 animate-pulse">
          StudioNei
        </span>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-background bg-canvas-texture text-foreground font-sans transition-colors duration-500">
      {/* Editorial signature bar (22px) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-6 sm:h-[26px] flex items-center justify-center bg-background border-b border-white/5 px-2 [contain:paint]">
        <span className="label-luxe truncate text-[0.55rem] tracking-[0.4em] sm:text-[0.62rem] sm:tracking-[0.6em] font-light opacity-80">Arte · Pintura · Projetos Autorais</span>
      </div>

      {/* Header (sticky, layered) */}
      <header className="fixed top-6 sm:top-[26px] left-0 right-0 z-40 bg-background/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl [contain:paint]">
        {/* Logo row */}
        <div className="h-14 sm:h-[70px] max-w-7xl mx-auto px-3 sm:px-6 md:px-10 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">

          <div />
          <a
            href="#top"
            className="group justify-self-center flex items-center gap-2 min-w-0 transition-transform duration-200 hover:scale-[1.04]"
          >
            <span className="label-luxe shrink-0 hidden sm:block">·</span>
            <span
              className="font-display text-[1.8rem] sm:text-3xl md:text-[2.6rem] leading-none tracking-tight truncate text-foreground transition-all duration-500 group-hover:tracking-[0.02em]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Studio
              <span className="italic font-normal text-[#d8bf85] ml-1 drop-shadow-[0_0_15px_rgba(216,191,133,0.4)]">
                Nei
              </span>
            </span>
          </a>
          <div className="justify-self-end flex items-center gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="group relative inline-flex items-center gap-2 text-xs font-bold text-yellow-400 border border-yellow-400/40 rounded-xl px-4 py-2 bg-yellow-400/5 shadow-[0_10px_20px_-5px_rgba(250,204,21,0.2)] hover:shadow-[0_15px_30px_-8px_rgba(250,204,21,0.4)] hover:border-yellow-300 hover:bg-yellow-400/10 transition-all active:scale-[0.97]"
              >
                <LogOut className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" /> <span className="hidden sm:inline">Sair</span>
              </button>
            ) : guest ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[0.6rem] uppercase tracking-[0.28em] text-sky-200/70 border border-sky-400/30 rounded-full px-2.5 py-1">
                  Visitante · leitura
                </span>
                <button
                  type="button"
                  onClick={() => {
                    exitGuest();
                    navigate({ to: "/auth", replace: true });
                  }}
                  className="group relative inline-flex items-center gap-2 text-xs font-bold text-sky-400 border border-sky-400/40 rounded-xl px-4 py-2 bg-sky-400/5 shadow-[0_10px_20px_-5px_rgba(56,189,248,0.2)] hover:shadow-[0_15px_30px_-8px_rgba(56,189,248,0.4)] hover:bg-sky-400/10 hover:border-sky-300 transition-all active:scale-[0.97]"

                >
                  <LogOut className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" /> <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="group relative inline-flex items-center gap-2 text-xs font-bold text-sky-400 border border-sky-400/40 rounded-xl px-4 py-2 bg-sky-400/5 shadow-[0_10px_20px_-5px_rgba(56,189,248,0.2)] hover:shadow-[0_15px_30px_-8px_rgba(56,189,248,0.4)] hover:bg-sky-400/10 hover:border-sky-300 transition-all active:scale-[0.97]"
              >
                <LogIn className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /> <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>


        </div>

        {/* Categories pills */}
        <div className="h-[52px] sm:h-[64px] border-t border-white/5 bg-background/40 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 md:px-12 flex items-center gap-3">
            {/* Todos — fixed left */}
            <button
              type="button"
              onClick={openAllModal}
              className="shrink-0 inline-flex min-h-[38px] items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-950 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_30px_-8px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span>Todos</span>
              <span className="opacity-60 font-medium tabular-nums text-[10px] sm:text-xs">({totalCount})</span>
            </button>

            {/* Categories — scrollable center with arrows */}
            <div className="relative flex-1 min-w-0 h-full group/nav">
              <CategoryScroll categories={categories} counts={counts} />
            </div>

            {/* Gerenciar — fixed right */}

            {/* Gerenciar — fixed right */}
            {isAdmin && (
              <button
                type="button"
                onClick={openCategoryManager}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#d8bf85] border border-[#d8bf85]/30 bg-[#d8bf85]/[0.05] hover:bg-[#d8bf85]/15 hover:border-[#d8bf85]/60 transition-all duration-300 hover:scale-[1.03]"
                title="Gerenciar categorias"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Gerenciar</span>
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="border-t border-white/5 bg-background/30 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3 relative">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-300/70" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Pesquisar obras..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-sky-400/60 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-300"
              />
            </div>

            {searchFocused && (
              <div className="absolute left-3 right-3 sm:left-6 sm:right-6 mt-1 max-h-[50vh] overflow-y-auto rounded-xl border border-sky-400/40 bg-background/95 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(56,155,255,0.5)] z-10 animate-fade-in">
                {query.trim() !== "" && (
                  <button
                    onClick={() => setQuery("")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-widest text-sky-400/70 hover:bg-sky-400/10 transition-colors border-b border-sky-400/10"
                  >
                    <X className="h-3 w-3" /> Limpar busca
                  </button>
                )}
                {suggestions.length > 0 ? (
                  suggestions.map((c) => {
                    const Icon = getIcon(c.icon);
                    return (
                      <Link
                        key={c.id}
                        to="/galeria/$categoria"
                        params={{ categoria: c.name }}
                        onClick={() => setQuery("")}
                        className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-sky-400/10 hover:text-sky-100 transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-sky-300/85" />
                        {c.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({counts[c.name] ?? 0})
                        </span>
                      </Link>
                    );
                  })
                ) : query.trim() !== "" ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Nenhuma categoria encontrada para "{query}"
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Digite para pesquisar categorias...
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Neon gradient separator */}
        <div className="h-[1px] bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.4),transparent)] opacity-50" />
      </header>

      {/* Hero */}
      <section id="top" className="relative min-h-[100svh] flex items-center overflow-hidden pt-[200px] sm:pt-[224px] md:pt-[220px]">

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
                O talento apresentado em{" "}
                <span className="text-shimmer italic font-normal">galeria</span>.
              </h1>
              <p className="relative mt-4 font-display italic text-lg md:text-xl text-[#d8bf85]/85 drop-shadow-[0_0_14px_rgba(216,191,133,0.35)]">
                "Onde cada parede se transforma em arte."
              </p>

              <p className="relative mt-6 text-base md:text-lg text-foreground/85 max-w-lg leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]">
                Uma coleção em um ambiente digital onde a obra é o foco.
                <br />
                Uma forma organizada de apresentação do conjunto de obras.
              </p>
            </div>
            <div className="mt-10 sm:mt-12 flex flex-wrap gap-4 sm:gap-6">
              <a
                href="#about"
                className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-full bg-sky-400 text-slate-950 text-sm font-bold shadow-[0_20px_40px_-10px_rgba(56,189,248,0.5)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_25px_50px_-8px_rgba(56,189,248,0.7)] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
                <span className="relative">Sobre o Artista</span>
              </a>

            </div>
          </motion.div>
        </div>

      </section>

      {/* Featured */}
      <section id="gallery" className="relative overflow-hidden bg-gallery-petrol py-8 sm:py-12 md:py-16">
        {/* soft central spotlight */}
        <div className="absolute inset-0 gallery-spotlight" />
        {/* edge vignette */}
        <div className="absolute inset-0 gallery-vignette" />
        {/* top gold divider */}
        <div className="absolute top-0 left-0 right-0 gallery-rule-gold" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          {/* Gallery title */}
          <div className="relative z-10 text-center pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="rule-gold w-10 sm:w-12" />
              <span className="label-luxe">Destaques</span>
              <div className="rule-gold w-10 sm:w-12" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.01em] animate-title-glow-subtle">
              Coleção em <span className="italic text-gold-shimmer">Destaque</span>
            </h2>
          </div>

          <Suspense fallback={<div className="h-[420px]" />}>
            <StackedCarousel
              slides={slides.length ? slides : featuredSlides}
              urls={featuredUrls}
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
        </div>

        {/* bottom gold divider */}
        <div className="absolute bottom-0 left-0 right-0 gallery-rule-gold" />
      </section>


      {/* About */}
      <section id="about" className="relative overflow-hidden">
        {/* artistic graphite / charcoal texture */}
        <div className="pointer-events-none absolute inset-0 bg-canvas-texture opacity-40" />
        <div className="relative max-w-5xl mx-auto px-4 sm:pl-4 sm:pr-8 md:pl-2 md:pr-10 py-10 sm:py-8 grid md:grid-cols-[220px_1fr] gap-8 md:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
            className="group relative justify-self-start w-40 sm:w-48 md:w-full max-w-[220px] md:-ml-2"
          >
            {/* charcoal smudge behind the portrait */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 -z-10 opacity-[0.18] blur-[2px]"
              style={{
                background:
                  "radial-gradient(60% 45% at 35% 30%, rgba(255,255,255,0.5), transparent 70%), radial-gradient(45% 60% at 70% 75%, rgba(216,191,133,0.45), transparent 72%)",
              }}
            />
            <div className="artist-portrait-premium">
              <img
                src={artist}
                alt="Retrato do artista"
                loading="lazy"
                decoding="async"
                className="relative rounded-full w-full aspect-square object-cover shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex items-center gap-4 mb-4"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                style={{ transformOrigin: "left" }}
                className="rule-gold w-12"
              />
              <span className="label-luxe">Sobre</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="font-display text-3xl sm:text-4xl md:text-5xl font-light mb-2 tracking-[0.01em] animate-title-glow-subtle"
            >
              O <span className="italic text-gold-shimmer">Artista</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="font-display italic text-base sm:text-lg text-[#d8bf85]/85 mb-5"
            >
              Conheça a trajetória, técnica e inspiração por trás das obras.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="text-foreground/85 leading-relaxed text-base sm:text-lg mb-6 max-w-[58ch]"
            >
              StudioNei nasce do encontro entre técnica clássica e sensibilidade
              contemporânea. Cada obra é um exercício de observação — luz,
              textura e silêncio traduzidos em grafite, carvão e tinta.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-wrap items-center gap-3"
            >
              <a
                href="https://www.instagram.com/sidnei_costa1961?igsh=MWFsdWF4NTlsOTJoaA=="
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-foreground border border-white/15 transition-all duration-300 hover:border-[#d8bf85]/70 hover:text-[#f5e6b8] hover:shadow-[0_0_22px_rgba(216,191,133,0.55)]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(64,93,230,0.18), rgba(193,53,132,0.18) 45%, rgba(253,175,69,0.18))",
                }}
              >
                <Instagram
                  className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: "#E1306C" }}
                />
                Instagram
              </a>

              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText("costa.sidnei@gmail.com")
                    .then(() => {
                      setEmailCopied(true);
                      setTimeout(() => setEmailCopied(false), 1800);
                    });
                }}
                className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-foreground border border-white/15 bg-white/[0.03] transition-all duration-300 hover:border-[#d8bf85]/70 hover:text-[#f5e6b8] hover:shadow-[0_0_22px_rgba(216,191,133,0.45)]"
                title="Copiar e-mail"
              >
                {emailCopied ? (
                  <Check className="h-4 w-4 text-[#d8bf85]" />
                ) : (
                  <Copy className="h-4 w-4 opacity-80" />
                )}
                {emailCopied ? "E-mail copiado" : "costa.sidnei@gmail.com"}
              </button>
            </motion.div>
          </div>
        </div>

        {/* discreet signature */}
        <div className="relative max-w-5xl mx-auto px-6 md:px-10 pb-4 text-right">
          <span className="font-display italic text-sm text-[#d8bf85]/45 tracking-wide">
            Sidnei Costa
          </span>
        </div>
      </section>


      {/* Artistic section divider */}
      <div className="artistic-divider max-w-md mx-auto my-1" />


      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0910] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-16 grid md:grid-cols-2 gap-12 sm:gap-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-[#d8bf85] mb-4" />
              <span className="font-display text-3xl md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Studio<span className="italic font-normal text-[#d8bf85] ml-1 drop-shadow-[0_0_10px_rgba(216,191,133,0.4)]">Nei</span>
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
        <div className="border-t border-white/5 py-8 text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-white/30">
            © {new Date().getFullYear()} StudioNei · Todos os direitos reservados
          </p>
        </div>
      </footer>
      <Suspense fallback={null}>
        {lightbox && <Lightbox data={lightbox} onClose={closeLightbox} />}
        {showCategoryManager && (
          <CategoryManager
            open={showCategoryManager}
            onClose={closeCategoryManager}
            onChanged={() => {
              void queryClient.invalidateQueries({ queryKey: ["categories"] });
              void queryClient.invalidateQueries({ queryKey: ["artwork-counts"] });
              void queryClient.invalidateQueries({ queryKey: ["featured-urls"] });
            }}
          />
        )}
        {showAllModal && (
          <AllArtworksModal
            open={showAllModal}
            onClose={closeAllModal}
            onOpenLightbox={(d) => {
              setShowAllModal(false);
              setLightbox(d);
            }}
          />
        )}
      </Suspense>
    </div>
  );

}

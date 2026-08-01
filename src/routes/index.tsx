import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
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

  // Build slides: two per category (pos 0 and 1) using the first images available
  const slides = categories.flatMap((c) => {
    const base = {
      src: fallbackSrc[c.name] ?? paisagem1,
      title: c.name,
      categoria: c.name,
      description: fallbackDescriptions[c.name] ?? `Obra da coleção ${c.name}.`,
    };
    return [
      { ...base, pos: 0 },
      { ...base, pos: 1 },
    ];
  });

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
              className="font-display text-[1.6rem] sm:text-3xl md:text-[2.4rem] leading-none tracking-wide truncate text-foreground transition-all duration-300 group-hover:tracking-[0.05em] will-change-transform"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Studio
              <span className="italic font-normal text-[#d8bf85] drop-shadow-[0_0_10px_rgba(216,191,133,0.5)] group-hover:drop-shadow-[0_0_14px_rgba(216,191,133,0.75)]">
                Nei
              </span>
            </span>
          </a>
          <div className="justify-self-end flex items-center gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-300 border border-yellow-300/70 rounded-full px-2.5 sm:px-3 py-1.5 bg-yellow-300/5 shadow-[0_0_12px_rgba(250,204,21,0.45)] hover:shadow-[0_0_26px_rgba(250,204,21,0.85)] hover:border-yellow-200 hover:text-yellow-200 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sair</span>
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-200 border border-sky-400/50 rounded-full px-2.5 sm:px-3 py-1.5 bg-sky-400/5 hover:bg-sky-400/15 hover:border-sky-300 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-200 border border-sky-400/50 rounded-full px-2.5 sm:px-3 py-1.5 bg-sky-400/5 hover:bg-sky-400/15 hover:border-sky-300 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>


        </div>

        {/* Categories pills — 60px */}
        <div className="h-[60px] border-t border-sky-400/15 bg-background/60">
          <div className="max-w-7xl mx-auto h-full px-2 sm:px-6 md:px-10 flex items-center gap-2">
            {/* Todos — fixed left */}
            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-sky-400 text-slate-950 border border-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.6)] hover:shadow-[0_0_26px_rgba(56,189,248,0.9)] transition-all duration-200 hover:scale-[1.05]"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Todos</span>
              <span className="sm:hidden">Todos</span>
              <span className="opacity-80 text-[10px] sm:text-xs">({totalCount})</span>
            </button>

            {/* Categories — scrollable center */}
            <div className="relative flex-1 min-w-0 h-full">
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-12 bg-gradient-to-l from-background/80 via-background/50 to-transparent z-10" />
              <div className="h-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory overscroll-contain">
                <div className="flex items-center gap-2 h-full px-1 pr-10">
                  {categories.map((c) => {
                    const Icon = getIcon(c.icon);
                    return (
                      <Link
                        key={c.id}
                        to="/galeria/$categoria"
                        params={{ categoria: c.name }}
                        className="shrink-0 snap-start group inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-foreground/85 border border-sky-400/40 bg-transparent hover:bg-sky-400/10 hover:border-sky-300 hover:text-sky-100 hover:shadow-[0_0_14px_rgba(56,155,255,0.6)] transition-all duration-200 hover:scale-[1.05]"
                      >
                        <Icon className="h-3.5 w-3.5 text-sky-300/85 group-hover:text-sky-200" />
                        <span className="whitespace-nowrap">{c.name}</span>
                        <span className="opacity-60 text-[10px] sm:text-xs">({counts[c.name] ?? 0})</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gerenciar — fixed right */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCategoryManager(true)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#d8bf85] border border-[#d8bf85]/50 bg-[#d8bf85]/[0.06] hover:bg-[#d8bf85]/15 hover:border-[#d8bf85] transition-all duration-200 hover:scale-[1.05]"
                title="Gerenciar categorias"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Gerenciar</span>
              </button>
            )}
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
                {suggestions.map((c) => {
                  const Icon = getIcon(c.icon);
                  return (
                    <Link
                      key={c.id}
                      to="/galeria/$categoria"
                      params={{ categoria: c.name }}
                      onClick={() => setQuery("")}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-sky-400/10 hover:text-sky-100 transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 text-sky-300/85" />
                      {c.name}
                      <span className="ml-auto text-xs text-muted-foreground">
                        ({counts[c.name] ?? 0})
                      </span>
                    </Link>
                  );
                })}
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
            <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
              <a
                href="#about"
                className="group inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-sky-400/40 text-foreground rounded-full text-xs sm:text-sm hover:border-sky-300 hover:text-sky-200 hover:shadow-[0_0_18px_rgba(56,155,255,0.6)] hover:bg-sky-400/5 transition-all duration-300"
              >
                Sobre o Artista
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
        {showCategoryManager && (
          <CategoryManager
            open={showCategoryManager}
            onClose={() => setShowCategoryManager(false)}
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
            onClose={() => setShowAllModal(false)}
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

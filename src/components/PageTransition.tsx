import { AnimatePresence, motion, useReducedMotion, type Transition, type Variants } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

export type TransitionVariant =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "zoom-in"
  | "zoom-out"
  | "flip-x"
  | "flip-y"
  | "parallax";

export type TransitionConfig = {
  variant?: TransitionVariant;
  duration?: number;
  ease?: Transition["ease"];
};

const DEFAULTS: Required<Pick<TransitionConfig, "variant" | "duration" | "ease">> = {
  variant: "fade",
  duration: 0.45,
  ease: [0.25, 0.1, 0.25, 1],

};

/**
 * Per-route override map. Keys are the route's `location.pathname` prefix.
 * The longest matching prefix wins; falls back to DEFAULTS.
 */
const ROUTE_TRANSITIONS: Array<{ match: (path: string) => boolean; config: TransitionConfig }> = [
  { match: (p) => p.startsWith("/galeria/"), config: { variant: "slide-left", duration: 0.6 } },
  { match: (p) => p === "/", config: { variant: "parallax", duration: 0.7 } },
];

function resolveConfig(pathname: string): Required<TransitionConfig> {
  const hit = ROUTE_TRANSITIONS.find((r) => r.match(pathname))?.config ?? {};
  return { ...DEFAULTS, ...hit } as Required<TransitionConfig>;
}

function buildVariants(variant: TransitionVariant): Variants {
  switch (variant) {
    case "slide-left":
      return {
        initial: { opacity: 0, x: 60 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -60 },
      };
    case "slide-right":
      return {
        initial: { opacity: 0, x: -60 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 60 },
      };
    case "slide-up":
      return {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -40 },
      };
    case "slide-down":
      return {
        initial: { opacity: 0, y: -40 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 40 },
      };
    case "zoom-in":
      return {
        initial: { opacity: 0, scale: 0.94 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.04 },
      };
    case "zoom-out":
      return {
        initial: { opacity: 0, scale: 1.06 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
      };
    case "flip-x":
      return {
        initial: { opacity: 0, rotateX: 25, transformPerspective: 1200 },
        animate: { opacity: 1, rotateX: 0, transformPerspective: 1200 },
        exit: { opacity: 0, rotateX: -25, transformPerspective: 1200 },
      };
    case "flip-y":
      return {
        initial: { opacity: 0, rotateY: 25, transformPerspective: 1200 },
        animate: { opacity: 1, rotateY: 0, transformPerspective: 1200 },
        exit: { opacity: 0, rotateY: -25, transformPerspective: 1200 },
      };
    case "parallax":
      return {
        initial: { opacity: 0, y: 30, scale: 0.985, filter: "blur(6px)" },
        animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, y: -20, scale: 1.01, filter: "blur(4px)" },
      };
    case "fade":
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prefersReducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const cfg = resolveConfig(pathname);
  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : buildVariants(cfg.variant);

  // On the very first render (SSR + hydration) skip the enter animation so
  // content isn't invisible while JS boots.
  if (!hydrated) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: cfg.duration, ease: cfg.ease }}
        style={{
          willChange: "transform, opacity, filter",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

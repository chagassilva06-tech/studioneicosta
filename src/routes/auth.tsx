import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso ao Atelier — StudioNei" },
      { name: "description", content: "Área privada do atelier StudioNei — arte, pintura e projetos autorais." },
      { property: "og:title", content: "Acesso ao Atelier — StudioNei" },
      { property: "og:description", content: "Área privada do atelier StudioNei — arte, pintura e projetos autorais." },
    ],
  }),
  component: AuthPage,
});

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed")) return "E-mail ainda não confirmado.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("network")) return "Erro de conexão. Verifique sua internet.";
  return "Não foi possível concluir. Tente novamente.";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "reset") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (err) throw err;
        setMessage("Enviamos um e-mail com instruções para redefinir sua senha.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (keepSignedIn) {
          localStorage.removeItem("sn:ephemeral");
        } else {
          localStorage.setItem("sn:ephemeral", "1");
        }
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: "signin" | "reset") => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden text-[color:var(--ink)]"
      style={{
        // Petrol blue base + warm ambient
        background:
          "radial-gradient(1200px 800px at 20% 10%, rgba(28,55,72,0.55), transparent 60%), radial-gradient(1000px 700px at 85% 90%, rgba(20,40,54,0.55), transparent 60%), linear-gradient(180deg, #0b1a24 0%, #0a1720 60%, #08141c 100%)",
        // custom vars scoped to this page
        ["--ink" as string]: "#eef1f4",
        ["--muted-ink" as string]: "#a8b3bd",
        ["--gold" as string]: "#b89a5e",
        ["--gold-soft" as string]: "#d8bf85",
        ["--petrol" as string]: "#1f4a5f",
      }}
    >
      {/* Canvas / linen texture overlay (~4% opacity) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />
      {/* Soft vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Corner artwork wireframe sketch */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        className="pointer-events-none absolute -bottom-10 -right-10 w-[280px] sm:w-[360px] md:w-[440px] opacity-[0.12]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        style={{ color: "var(--gold)" }}
      >
        <rect x="60" y="60" width="280" height="280" />
        <rect x="80" y="80" width="240" height="240" />
        <path d="M90 300 L170 200 L220 250 L280 170 L310 210 L310 300 Z" />
        <circle cx="260" cy="130" r="18" />
        <path d="M90 320 L310 320" />
      </svg>

      {/* Top-left signature tag */}
      <div className="relative z-10 px-6 sm:px-10 pt-6 flex items-center justify-between">
        <Link to="/" className="group inline-flex items-center gap-3">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-[color:var(--gold)] shadow-[0_0_10px_rgba(184,154,94,0.7)]" />
          <span
            className="text-[10px] sm:text-[11px] tracking-[0.55em] uppercase text-[color:var(--muted-ink)] group-hover:text-[color:var(--gold-soft)] transition-colors"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Arte · Pintura · Projetos Autorais
          </span>
        </Link>
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          {/* Logo + signature */}
          <div className="text-center mb-10 sm:mb-12">
            <Link to="/" className="inline-block">
              <div
                className="font-normal text-5xl sm:text-6xl tracking-wide text-[color:var(--ink)] transition-all duration-500 hover:tracking-[0.08em]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Studio<span className="italic text-[color:var(--gold-soft)]">Nei</span>
              </div>
            </Link>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[color:var(--gold)]/60" />
              <span
                className="text-[10px] tracking-[0.4em] uppercase text-[color:var(--muted-ink)]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Atelier
              </span>
              <span className="h-px w-8 bg-[color:var(--gold)]/60" />
            </div>
            <p
              className="mt-5 text-[13px] sm:text-sm italic text-[color:var(--muted-ink)]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Onde cada parede se transforma em arte.
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            className="relative rounded-[2px] border border-white/10 bg-white/[0.03] backdrop-blur-xl px-7 sm:px-10 py-9 sm:py-11 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)] animate-in fade-in duration-700"
          >
            {/* Ornamental corner marks */}
            <span aria-hidden className="absolute top-0 left-0 h-3 w-3 border-t border-l border-[color:var(--gold)]/60" />
            <span aria-hidden className="absolute top-0 right-0 h-3 w-3 border-t border-r border-[color:var(--gold)]/60" />
            <span aria-hidden className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-[color:var(--gold)]/60" />
            <span aria-hidden className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-[color:var(--gold)]/60" />

            <h1
              className="text-center text-2xl sm:text-[26px] font-normal tracking-[0.25em] uppercase text-[color:var(--ink)]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {mode === "signin" ? "Entrar" : "Redefinir"}
            </h1>
            <div className="mx-auto mt-3 mb-8 h-px w-16 bg-gradient-to-r from-transparent via-[color:var(--gold)]/70 to-transparent" />

            <div className="space-y-6">
              <div>
                <label
                  className="block text-[11px] tracking-[0.3em] uppercase text-[color:var(--muted-ink)] mb-3"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-transparent border-0 border-b border-white/15 text-[color:var(--ink)] placeholder:text-white/25 focus:outline-none focus:border-[color:var(--gold-soft)] transition-colors text-base"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  placeholder="seu@email.com"
                />
              </div>

              {mode !== "reset" && (
                <div>
                  <label
                    className="block text-[11px] tracking-[0.3em] uppercase text-[color:var(--muted-ink)] mb-3"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pr-10 bg-transparent border-0 border-b border-white/15 text-[color:var(--ink)] placeholder:text-white/25 focus:outline-none focus:border-[color:var(--gold-soft)] transition-colors text-base tracking-widest"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[color:var(--muted-ink)] hover:text-[color:var(--gold-soft)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "signin" && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchMode("reset")}
                        className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--muted-ink)] hover:text-[color:var(--gold-soft)] transition-colors"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mode === "signin" && (
                <label className="flex items-center gap-3 select-none cursor-pointer text-[12px] tracking-[0.15em] uppercase text-[color:var(--muted-ink)] hover:text-[color:var(--ink)] transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-3.5 w-3.5 border border-[color:var(--gold)]/60 bg-transparent peer-checked:bg-[color:var(--gold)] transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-[60%] after:h-1.5 after:w-[3px] after:border-r after:border-b after:border-[#0a1720] after:rotate-45 after:opacity-0 peer-checked:after:opacity-100"
                  />
                  Manter conectado
                </label>
              )}

              {error && (
                <p
                  className="text-xs tracking-wide text-red-200/90 border-l-2 border-red-400/60 pl-3 py-1 animate-in fade-in duration-300"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontStyle: "italic" }}
                >
                  {error}
                </p>
              )}
              {message && (
                <p
                  className="text-xs tracking-wide text-[color:var(--gold-soft)] border-l-2 border-[color:var(--gold)]/60 pl-3 py-1 animate-in fade-in duration-300"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontStyle: "italic" }}
                >
                  {message}
                </p>
              )}

              {/* Premium button with rule lines */}
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[color:var(--gold)]/50" />
                  <span className="h-1 w-1 rounded-full bg-[color:var(--gold)]/70" />
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[color:var(--gold)]/50" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full h-12 sm:h-[52px] overflow-hidden border border-[color:var(--gold)]/70 text-[color:var(--ink)] tracking-[0.4em] uppercase text-sm transition-all duration-500 hover:border-[color:var(--gold-soft)] hover:text-[#0a1720] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background:
                      "linear-gradient(180deg, rgba(31,74,95,0.35) 0%, rgba(10,23,32,0.25) 100%)",
                    boxShadow:
                      "inset 0 0 0 1px rgba(184,154,94,0.08), 0 10px 30px -10px rgba(0,0,0,0.6)",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background:
                        "linear-gradient(180deg, #d8bf85 0%, #b89a5e 100%)",
                    }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow:
                        "0 0 30px rgba(216,191,133,0.35), 0 0 60px rgba(184,154,94,0.25)",
                    }}
                  />
                  <span className="relative inline-flex items-center justify-center gap-2 w-full h-full">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === "reset" ? "Enviando..." : "Entrando..."}
                      </>
                    ) : mode === "signin" ? (
                      <>
                        <LogIn className="h-4 w-4" /> Entrar
                      </>
                    ) : (
                      <>Enviar link</>
                    )}
                  </span>
                </button>
                <div className="flex items-center gap-3 mt-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[color:var(--gold)]/50" />
                  <span className="h-1 w-1 rounded-full bg-[color:var(--gold)]/70" />
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[color:var(--gold)]/50" />
                </div>
              </div>

              {mode === "reset" && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="text-[11px] tracking-[0.25em] uppercase text-[color:var(--muted-ink)] hover:text-[color:var(--gold-soft)] transition-colors"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    ← Voltar para entrar
                  </button>
                </div>
              )}
            </div>
          </form>

          <p
            className="mt-8 text-center text-[10px] tracking-[0.45em] uppercase text-[color:var(--muted-ink)]/70"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            © StudioNei · Atelier
          </p>
        </div>
      </main>
    </div>
  );
}

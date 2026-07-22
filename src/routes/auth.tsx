import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso restrito — StudioNei" },
      { name: "description", content: "Área de administração do portfólio StudioNei." },
      { property: "og:title", content: "Acesso restrito — StudioNei" },
      { property: "og:description", content: "Área de administração do portfólio StudioNei." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (err) throw err;
        // Try immediate sign in (auto-confirm is enabled)
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setMessage("Conta criada. Faça login para continuar.");
          setMode("signin");
        } else {
          navigate({ to: "/" });
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,155,255,0.9)]" />
            <span className="font-display text-2xl tracking-wide">
              Studio<span className="text-sky-400">Nei</span>
            </span>
          </Link>
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-sky-400 border border-sky-400/60 rounded-full px-4 py-1.5 bg-sky-400/5 shadow-[0_0_12px_rgba(56,155,255,0.35)] hover:shadow-[0_0_24px_rgba(56,155,255,0.7)] hover:border-sky-300 transition-all"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-sky-400" />
              <span className="uppercase tracking-[0.4em] text-xs text-sky-400/90">Acesso restrito</span>
              <div className="h-px w-10 bg-sky-400" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-light">
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Área exclusiva para o gerenciamento das obras.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border-2 border-sky-400/40 bg-background/60 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_40px_-10px_rgba(56,155,255,0.5)] space-y-4"
          >
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-sky-400/90 mb-2">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-background/70 border-2 border-sky-400/40 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-sky-300 focus:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-sky-400/90 mb-2">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-background/70 border-2 border-sky-400/40 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-sky-300 focus:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
                placeholder="••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-sky-200 bg-sky-500/10 border border-sky-500/40 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-400 text-slate-950 rounded-full font-medium border-2 border-sky-400 hover:bg-sky-300 hover:shadow-[0_0_28px_rgba(56,155,255,0.85)] transition-all disabled:opacity-60"
            >
              {mode === "signin" ? (
                <>
                  <LogIn className="h-4 w-4" /> {loading ? "Entrando…" : "Entrar"}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> {loading ? "Criando…" : "Criar conta"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setMessage(null);
              }}
              className="w-full text-xs text-sky-300 hover:text-sky-200 transition-colors"
            >
              {mode === "signin" ? "Não tem conta? Criar cadastro" : "Já tem conta? Entrar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

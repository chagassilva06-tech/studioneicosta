import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, LogIn, UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
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

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed")) return "E-mail ainda não confirmado.";
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "Este e-mail já está cadastrado.";
  }
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("network")) return "Erro de conexão. Verifique sua internet.";
  return "Não foi possível concluir. Tente novamente.";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
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
      } else if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (err) throw err;
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

  const switchMode = (next: "signin" | "signup" | "reset") => {
    setMode(next);
    setError(null);
    setMessage(null);
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
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-sky-400" />
              <span className="uppercase tracking-[0.4em] text-xs text-sky-400/90">Acesso restrito</span>
              <div className="h-px w-12 bg-sky-400" />
            </div>
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
              <span className="h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_16px_rgba(56,155,255,0.9)]" />
              <span className="font-display text-4xl sm:text-5xl tracking-wide">
                Studio<span className="text-sky-400 drop-shadow-[0_0_10px_rgba(56,155,255,0.6)]">Nei</span>
              </span>
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl font-light mt-2">
              {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Redefinir senha"}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              {mode === "reset"
                ? "Informe seu e-mail para receber o link de redefinição."
                : "Área exclusiva para o gerenciamento das obras."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border border-sky-400/15 bg-background/40 backdrop-blur-md p-6 sm:p-8 shadow-[0_10px_40px_-10px_rgba(56,155,255,0.35)] space-y-5"
          >
            <div>
              <label className="block text-sm text-sky-300/90 mb-2">E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-full bg-background/70 border-2 border-sky-400/40 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-sky-300 focus:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
                placeholder="seu@email.com"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="block text-sm text-sky-300/90 mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-full bg-background/70 border-2 border-sky-400/40 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-sky-300 focus:shadow-[0_0_20px_rgba(56,155,255,0.6)] transition-all"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-sky-300/80 hover:text-sky-200 hover:bg-sky-400/10 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signin" && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode("reset")}
                      className="text-xs text-sky-300/90 hover:text-sky-200 transition-colors"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === "signin" && (
              <label className="flex items-center gap-2 select-none cursor-pointer text-sm text-foreground/85">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-4 w-4 rounded border-2 border-sky-400/70 bg-sky-400/5 shadow-[0_0_8px_rgba(56,155,255,0.35)] peer-checked:bg-sky-400 peer-checked:border-sky-300 peer-checked:shadow-[0_0_14px_rgba(56,155,255,0.75)] peer-focus-visible:ring-2 peer-focus-visible:ring-sky-300/70 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-[60%] after:h-2 after:w-1 after:border-r-2 after:border-b-2 after:border-slate-950 after:rotate-45 after:opacity-0 peer-checked:after:opacity-100"
                />
                Manter conectado?
              </label>
            )}

            {error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
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
              className="w-full inline-flex items-center justify-center gap-2 h-12 sm:h-[52px] px-6 bg-sky-400 text-slate-950 rounded-full font-semibold text-base border-2 border-sky-300 shadow-[0_0_20px_rgba(56,155,255,0.55)] hover:bg-sky-300 hover:shadow-[0_0_36px_rgba(56,155,255,0.9)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "signup" ? "Criando..." : mode === "reset" ? "Enviando..." : "Entrando..."}
                </>
              ) : mode === "signin" ? (
                <>
                  <LogIn className="h-4 w-4" /> Entrar
                </>
              ) : mode === "signup" ? (
                <>
                  <UserPlus className="h-4 w-4" /> Criar conta
                </>
              ) : (
                <>Enviar link</>
              )}
            </button>

            {mode === "reset" && (
              <div className="pt-2 text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-sky-300 hover:text-sky-200 font-medium transition-colors"
                >
                  ← Voltar para entrar
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

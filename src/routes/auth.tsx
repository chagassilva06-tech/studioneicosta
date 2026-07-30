import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — StudioNei" },
      {
        name: "description",
        content:
          "Área restrita do StudioNei. Acesso exclusivo dos administradores para gerenciar obras, categorias e destaques da galeria.",
      },
      { property: "og:title", content: "Entrar — StudioNei" },
      {
        property: "og:description",
        content:
          "Área restrita do StudioNei. Acesso exclusivo dos administradores da galeria de desenhos e pinturas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const ALLOWED = [
  "costa.sidnei@gmail.com",
  "sidnei.costa@gmail.com",
  "chagassilva06@hotmail.com",
];

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const mail = email.trim().toLowerCase();
    if (!mail || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (!ALLOWED.includes(mail)) {
      setError("Este e-mail não tem permissão de acesso.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: mail,
      password,
    });
    setLoading(false);
    if (err) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/" });
  };

  const forgot = async () => {
    const mail = email.trim().toLowerCase();
    if (!ALLOWED.includes(mail)) {
      setError("Informe seu e-mail de administrador primeiro.");
      return;
    }
    setError(null);
    await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setNotice("Enviamos um link de redefinição para o seu e-mail.");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a1250] text-white">
      {/* Gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_60%,#0b2a8f_0%,#101a6b_38%,#3a0f6e_70%,#8a12a8_100%)]" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[60vh] w-[60vh] rounded-full bg-fuchsia-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 -top-20 h-[55vh] w-[55vh] rounded-full bg-blue-500/30 blur-[120px]" />

      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
        {/* Glass card */}
        <div className="w-full max-w-[420px]">
          <form
            onSubmit={submit}
            className="relative overflow-hidden rounded-2xl border border-white/25 bg-white/[0.08] p-6 shadow-[0_24px_80px_-20px_rgba(6,10,60,0.9)] backdrop-blur-xl sm:p-7"
          >
            <div className="mb-8 flex items-center justify-center">
              <span className="rounded-full bg-white/15 px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/95 ring-1 ring-white/20">
                Studio Nei
              </span>
            </div>

            <h1 className="mb-7 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2rem]">
              Entre com sua conta
            </h1>

            <label className="mb-2 block text-sm text-white/90" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-5 h-12 w-full rounded-lg border border-white/30 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_6px,rgba(255,255,255,0.04)_6px,rgba(255,255,255,0.04)_12px)] px-4 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-white/70 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.12)]"
            />

            <label className="mb-2 block text-sm text-white/90" htmlFor="senha">
              senha
            </label>
            <div className="relative">
              <input
                id="senha"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-lg border border-white/30 bg-white/[0.10] px-4 pr-11 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-white/70 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.12)]"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-white"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={forgot}
              className="mt-2 block w-full text-right text-xs text-white/70 underline-offset-4 transition hover:text-white hover:underline"
            >
              Esqueci minha senha
            </button>

            {error && (
              <p className="mt-4 rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}
            {notice && (
              <p className="mt-4 rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 text-base font-semibold text-white shadow-[0_10px_40px_-8px_rgba(190,70,255,0.8)] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>

            {/* Wave footer */}
            <svg
              className="mt-6 h-8 w-full text-white/25"
              viewBox="0 0 400 40"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path d="M0 24 C 60 4, 120 44, 200 22 S 340 4, 400 24" stroke="currentColor" strokeWidth="2" />
              <path d="M0 32 C 60 12, 120 52, 200 30 S 340 12, 400 32" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            </svg>

            <p className="mt-5 text-center text-xs text-white/60 tracking-wide">
              @ Todos os direitos  Sidnei Costa 2026
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

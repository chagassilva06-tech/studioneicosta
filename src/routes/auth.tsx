import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  Images,
  Loader2,
  Lock,
  Mail,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import atelier from "@/assets/auth-atelier.jpg";

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

const FEATURES = [
  { icon: Images, title: "Galerias", sub: "Organizadas" },
  { icon: Heart, title: "Favoritos", sub: "Para inspirar" },
  { icon: ShieldCheck, title: "Privacidade", sub: "e segurança" },
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#080610] text-white">
      {/* Atelier photo — left side / full bleed on mobile */}
      <img
        src={atelier}
        alt="Ateliê de arte"
        width={1200}
        height={1408}
        className="pointer-events-none absolute inset-y-0 left-0 h-full w-full object-cover opacity-45 lg:w-[58%] lg:opacity-100"
      />
      {/* Fades / ambient light */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,6,16,0.75)_0%,rgba(8,6,16,0.35)_28%,rgba(8,6,16,0.92)_62%,#080610_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_50%,rgba(124,58,237,0.35),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-[60vh] w-[45vh] rounded-full bg-fuchsia-600/25 blur-[130px]" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_minmax(380px,440px)] lg:gap-16">
        {/* Left column */}
        <div className="flex flex-col justify-between gap-12 lg:min-h-[560px] lg:py-4">
          <div>
            <h2 className="font-serif text-3xl italic tracking-wide text-white sm:text-4xl">
              Studio Nei
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.42em] text-white/70">
              Galeria de Arte
            </p>
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
              Sua arte.
              <br />
              Sua história.
              <br />
              <span className="bg-gradient-to-r from-fuchsia-400 via-fuchsia-500 to-violet-400 bg-clip-text text-transparent">
                Nosso espaço.
              </span>
            </h1>
            <p className="mt-6 max-w-[22ch] text-sm leading-relaxed text-white/70 sm:text-base">
              Um lugar exclusivo para valorizar, exibir e eternizar sua criatividade.
            </p>
          </div>

          <div className="flex gap-7 sm:gap-9">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="text-left">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl border border-fuchsia-400/40 bg-white/[0.04] text-fuchsia-300 shadow-[0_0_20px_-6px_rgba(217,70,239,0.7)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-white sm:text-sm">{title}</p>
                <p className="text-[11px] text-white/55">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="w-full rounded-[22px] border border-white/10 bg-[#0d0b16]/85 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-8"
        >
          <div className="mb-6 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-violet-300 shadow-[0_0_30px_-8px_rgba(139,92,246,0.9)]">
              <Palette className="h-6 w-6" />
            </span>
          </div>

          <h2 className="mb-8 text-center text-3xl font-bold leading-tight tracking-tight sm:text-[2rem]">
            Entre com
            <br />
            sua{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              conta
            </span>
          </h2>

          <label className="mb-2 block text-xs font-medium text-white/80" htmlFor="email">
            E-mail
          </label>
          <div className="relative mb-5">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-violet-400/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.18)]"
            />
          </div>

          <label className="mb-2 block text-xs font-medium text-white/80" htmlFor="senha">
            Senha
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              id="senha"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-violet-400/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.18)]"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={forgot}
            className="mt-3 block w-full text-right text-xs text-violet-300/90 underline-offset-4 transition hover:text-violet-200 hover:underline"
          >
            Esqueci minha senha
          </button>

          {error && (
            <p className="mt-4 rounded-lg border border-red-300/30 bg-red-500/15 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-4 rounded-lg border border-emerald-300/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group mt-5 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-base font-semibold text-white shadow-[0_16px_45px_-12px_rgba(168,85,247,0.85)] transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/45">
            <Lock className="h-3 w-3" /> Seus dados estão protegidos
          </p>
          <p className="mt-3 text-center text-[11px] tracking-wide text-white/35">
            @ Todos os direitos Sidnei Costa 2026
          </p>
        </form>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Palette,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enterGuest, exitGuest } from "@/lib/guest";
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
    exitGuest();
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

      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-[1300px] grid-cols-1 items-center gap-12 px-6 py-10 sm:px-12 lg:grid-cols-[1.1fr_minmax(420px,520px)] lg:gap-20">
        {/* Left column */}
        <div className="flex flex-col justify-between gap-12 lg:min-h-[600px] lg:py-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="font-serif text-3xl italic tracking-wide text-white sm:text-5xl lg:text-6xl">
              Studio Nei
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-px w-10 bg-[#d8bf85]" />
              <p className="text-[11px] uppercase tracking-[0.5em] text-white/80">
                Arte · Pintura · Projetos Autorais
              </p>
            </div>
          </motion.div>

          <div className="space-y-8">
            <h1
              className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl"
              style={{ perspective: "1200px" }}
            >
              <motion.span
                className="bg-gradient-to-r from-slate-200 via-sky-200 to-cyan-200 bg-clip-text text-transparent"
                style={{
                  display: "inline-block",
                  filter:
                    "drop-shadow(0 2px 4px rgba(56,189,248,0.4)) drop-shadow(0 4px 12px rgba(14,165,233,0.3))",
                }}
                initial={{ opacity: 0, y: 30, rotateX: 20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                whileHover={{ scale: 1.03, rotateX: -4, transition: { duration: 0.5 } }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              >
                Galeria de<br />Arte Digital
              </motion.span>
            </h1>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <p className="max-w-[32ch] text-base font-light leading-relaxed text-white/80 sm:text-lg">
                Sua arte. Seu espaço. Onde cada obra encontra o seu lugar de destaque.
              </p>
              <div className="flex items-center gap-4 text-white/60">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm" />
                  ))}
                </div>
                <p className="text-xs tracking-wider uppercase">Coleções Curadas</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0910]/80 p-6 shadow-[0_0_100px_rgba(124,58,237,0.15),0_50px_160px_-40px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-[32px] sm:p-10 lg:h-[600px] flex flex-col justify-center"
        >
          {/* Reflexo da pintura — lado esquerdo */}
          <div className="pointer-events-none absolute -left-20 top-0 h-full w-[70%] bg-[radial-gradient(60%_60%_at_0%_35%,rgba(168,85,247,1),rgba(236,72,153,0.8)_45%,rgba(251,146,60,0.6)_75%,transparent_100%)] opacity-[0.035] blur-3xl" />
          {/* Pincelada translúcida no rodapé */}
          <div className="pointer-events-none absolute -bottom-6 left-1/2 h-16 w-[78%] -translate-x-1/2 rotate-[-2deg] rounded-[50%] bg-white opacity-[0.04] blur-xl" />

          <div className="relative">
            {/* Grupo 1 — selo */}
            <div className="mb-7 flex justify-center">
              <span className="flex h-[70px] w-[70px] sm:h-[84px] sm:w-[84px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] text-violet-300 shadow-[0_20px_50px_-12px_rgba(139,92,246,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl rotate-3 transition-transform hover:rotate-0 duration-500">
                <Palette className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.2} />
              </span>
            </div>

            {/* Grupo 2 — título */}
            <div className="mb-9 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/45">
                Bem-vindo ao
              </p>
              <h2 className="mt-2 font-serif text-[1.7rem] xs:text-[2.1rem] italic leading-tight tracking-wide text-white sm:text-[2.35rem]">
                Studio{" "}
                <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Nei
                </span>
              </h2>
              <p className="mx-auto mt-3 max-w-[26ch] text-sm leading-relaxed text-white/55">
                Entre com sua conta para acessar sua galeria.
              </p>
            </div>

            {/* Grupo 3 — campos */}
            <div className="group/field mb-5">
              <label
                className="mb-2 block text-xs font-medium text-white/80 transition-colors group-focus-within/field:text-violet-300"
                htmlFor="email"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/45 transition-colors group-focus-within/field:text-violet-300" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[52px] w-full rounded-xl border border-white/[0.14] bg-white/[0.06] pl-11 pr-4 text-base sm:text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none backdrop-blur-[18px] transition-all duration-300 placeholder:text-white/55 hover:border-white/30 hover:bg-white/[0.09] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_15px_rgba(255,255,255,0.05)] focus:border-sky-400/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.22),0_0_24px_-6px_rgba(168,85,247,0.7),inset_0_1px_0_rgba(255,255,255,0.1)]"
                />
              </div>
            </div>

            <div className="group/field">
              <label
                className="mb-2 block text-xs font-medium text-white/80 transition-colors group-focus-within/field:text-violet-300"
                htmlFor="senha"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/45 transition-colors group-focus-within/field:text-violet-300" />
                <input
                  id="senha"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[52px] w-full rounded-xl border border-white/[0.14] bg-white/[0.06] pl-11 pr-12 text-base sm:text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none backdrop-blur-[18px] transition-all duration-300 placeholder:text-white/55 hover:border-white/30 hover:bg-white/[0.09] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_15px_rgba(255,255,255,0.05)] focus:border-sky-400/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.22),0_0_24px_-6px_rgba(168,85,247,0.7),inset_0_1px_0_rgba(255,255,255,0.1)]"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                >
                  {show ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={forgot}
              className="mt-3 ml-auto block text-xs font-medium text-white/50 underline-offset-4 transition-colors hover:text-violet-300 hover:underline"
            >
              Esqueci minha senha
            </button>

            {error && (
              <p className="mt-5 rounded-lg border border-red-300/30 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}
            {notice && (
              <p className="mt-5 rounded-lg border border-emerald-300/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
                {notice}
              </p>
            )}

            {/* Grupo 4 — botão */}
            <button
              type="submit"
              disabled={loading}
              className="mt-8 inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#c026d3_50%,#2563eb_100%)] bg-[length:200%_100%] bg-[position:0%_50%] text-lg font-bold text-white shadow-[0_20px_40px_-10px_rgba(124,58,237,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-700 ease-out hover:bg-[position:100%_50%] hover:shadow-[0_25px_50px_-8px_rgba(192,38,211,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>

            {/* Acesso somente leitura */}
            <button
              type="button"
              onClick={() => {
                enterGuest();
                navigate({ to: "/" });
              }}
              className="mt-3 inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-full border border-sky-400/45 bg-transparent text-sm font-medium text-sky-200 transition-all duration-300 hover:border-sky-300/80 hover:bg-sky-400/10 hover:text-sky-100 hover:shadow-[0_0_26px_-6px_rgba(56,189,248,0.7)]"
            >
              <UserRound className="h-4 w-4" /> Entrar como Visitante
            </button>

            {/* Grupo 5 — informações */}
            <div className="mt-9">
              <p className="flex items-center justify-center gap-2 text-xs font-medium text-white/70">
                <Lock className="h-3.5 w-3.5" /> Seus dados estão protegidos
              </p>
              <div className="mx-auto my-4 h-px w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <p className="text-center text-[10px] tracking-[0.18em] text-white/25">
                © Studio Nei 2026
              </p>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

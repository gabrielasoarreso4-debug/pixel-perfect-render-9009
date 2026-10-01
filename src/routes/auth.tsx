import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined } => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" ? (s["mode"] as Mode) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Sinoslaser Área do Cliente" },
      { name: "description", content: "Acesse sua área exclusiva de cliente Sinoslaser." },
      { property: "og:title", content: "Entrar — Sinoslaser Área do Cliente" },
      { property: "og:description", content: "Acesse sua área exclusiva de cliente Sinoslaser." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", whatsapp: "", password: "" });
  const [sentConfirm, setSentConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/inicio", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) throw new Error("E-mail ou senha incorretos.");
      } else if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin + "/inicio",
            data: { full_name: parsed.data.full_name, whatsapp: parsed.data.whatsapp },
          },
        });
        if (error) throw error;
        setSentConfirm(true);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link para redefinir sua senha.");
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error("Não foi possível entrar com o Google.");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-brand p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <div className="absolute -left-20 top-20 size-96 rounded-full border border-primary-foreground/25" />
        <div className="absolute -bottom-32 right-0 size-[28rem] rounded-full border border-primary-foreground/15" />
        <Wordmark light className="relative" />
        <div className="relative">
          <h2 className="text-5xl font-bold leading-tight">Sua clínica em outro nível.</h2>
          <p className="mt-4 max-w-sm opacity-85">Treinamentos, protocolos e suporte dos seus equipamentos Sinoslaser.</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <Link to="/" className="mb-10 md:hidden"><Wordmark /></Link>
        <div className="mx-auto w-full max-w-sm">
          {sentConfirm ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary">Confirme seu e-mail</h1>
              <p className="mt-3 text-muted-foreground">
                Enviamos um link para <strong>{form.email}</strong>. Clique nele para ativar sua conta.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => { setSentConfirm(false); setMode("login"); }}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-primary">
                {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Acesse sua área exclusiva de cliente."
                  : mode === "signup"
                    ? "Use o mesmo e-mail cadastrado na Sinoslaser."
                    : "Informe seu e-mail para receber o link."}
              </p>

              <form onSubmit={submit} className="mt-8 space-y-4">
                {mode === "signup" && (
                  <Field label="Nome completo"><Input value={form.full_name} onChange={set("full_name")} required className="h-12 rounded-full px-5" /></Field>
                )}
                <Field label="E-mail"><Input type="email" value={form.email} onChange={set("email")} required className="h-12 rounded-full px-5" /></Field>
                {mode === "signup" && (
                  <Field label="WhatsApp"><Input type="tel" placeholder="(51) 99999-9999" value={form.whatsapp} onChange={set("whatsapp")} required className="h-12 rounded-full px-5" /></Field>
                )}
                {mode !== "forgot" && (
                  <Field label="Senha"><Input type="password" value={form.password} onChange={set("password")} required className="h-12 rounded-full px-5" /></Field>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
                </Button>
              </form>

              {mode !== "forgot" && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
                </>
              )}

              <div className="mt-8 space-y-2 text-center text-sm">
                {mode === "login" && (
                  <>
                    <button className="text-primary underline-offset-4 hover:underline" onClick={() => setMode("forgot")}>Esqueci minha senha</button>
                    <p className="text-muted-foreground">Ainda não tem conta? <button className="font-medium text-primary" onClick={() => setMode("signup")}>Criar conta</button></p>
                  </>
                )}
                {mode !== "login" && (
                  <button className="font-medium text-primary" onClick={() => setMode("login")}>Já tenho conta — entrar</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="pl-4 text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

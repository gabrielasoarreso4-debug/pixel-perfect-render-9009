import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchMe, temAcesso, whatsappUrl } from "@/lib/data";
import { criarPrimeiroAdmin, existeAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
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

const email = (u: string) => `${u.trim().toLowerCase()}@app.local`;

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [setup, setSetup] = useState(false);

  async function rotear() {
    qc.removeQueries({ queryKey: ["me"] });
    const me = await fetchMe();
    if (!me) return;
    if (me.isAdmin) return navigate({ to: "/admin", replace: true });
    if (!temAcesso(me.profile)) {
      await supabase.auth.signOut();
      setBloqueado(true);
      return;
    }
    navigate({ to: "/home", replace: true });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && rotear());
    existeAdmin().then((r) => setSetup(!r.existe)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setBloqueado(false);
    try {
      if (setup) {
        await criarPrimeiroAdmin({ data: { nome, usuario, senha } });
        toast.success("Administrador criado!");
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email(usuario), password: senha });
      if (error) throw new Error("Usuário ou senha incorretos.");
      await rotear();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-primary">{setup ? "Criar administrador" : "Entrar"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {setup ? "Primeiro acesso: crie o usuário administrador da Sinoslaser." : "Use o usuário e a senha fornecidos pela Sinoslaser."}
          </p>

          {bloqueado && (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-semibold text-destructive">Acesso indisponível, fale com o suporte.</p>
              <Button asChild variant="whatsapp" size="sm" className="mt-3">
                <a href={whatsappUrl("Olá! Meu acesso à área do cliente está indisponível.")} target="_blank" rel="noreferrer">
                  <MessageCircle /> Falar com o suporte
                </a>
              </Button>
            </div>
          )}

          <form onSubmit={submit} className="mt-8 space-y-4">
            {setup && (
              <Field label="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} required className="h-12 rounded-full px-5" /></Field>
            )}
            <Field label="Usuário"><Input autoCapitalize="none" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} required className="h-12 rounded-full px-5" /></Field>
            <Field label="Senha"><Input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="h-12 rounded-full px-5" /></Field>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : setup ? "Criar e entrar" : "Entrar"}
            </Button>
          </form>
          {!setup && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Esqueceu a senha?{" "}
              <a className="font-medium text-primary" href={whatsappUrl("Olá! Esqueci minha senha da área do cliente.")} target="_blank" rel="noreferrer">Fale com o suporte</a>
            </p>
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

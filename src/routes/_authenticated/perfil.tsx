import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientShell, useSignOut } from "@/components/ClientShell";
import { PageHeader } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, useMe } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <Page />
    </ClientShell>
  ),
});

function Page() {
  const { data: me } = useMe();
  const signOut = useSignOut();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");

  async function changePw() {
    if (pw.length < 6) return void toast.error("A nova senha precisa ter 6+ caracteres.");
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as never);
    if (error) return void toast.error("Não foi possível alterar a senha. Confira a senha atual.");
    toast.success("Senha alterada.");
    setCur("");
    setPw("");
  }

  return (
    <>
      <PageHeader eyebrow="Minha conta" title="Perfil" />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-card">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">Nome</dt><dd className="font-medium">{me?.profile?.nome}</dd>
            <dt className="text-muted-foreground">Usuário</dt><dd>{me?.profile?.usuario}</dd>
            <dt className="text-muted-foreground">Acesso até</dt><dd>{formatDate(me?.profile?.acesso_ate)}</dd>
          </dl>
          <Button variant="ghost" onClick={signOut}>Sair</Button>
        </section>
        <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-card">
          <h2 className="text-xl font-semibold text-primary">Alterar senha</h2>
          <Input type="password" placeholder="Senha atual" value={cur} onChange={(e) => setCur(e.target.value)} />
          <Input type="password" placeholder="Nova senha" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Button variant="outline" onClick={changePw}>Alterar senha</Button>
        </section>
      </div>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientShell, useSignOut } from "@/components/ClientShell";
import { PageHeader } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accessInfo, formatDate, useMe } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Sinoslaser" }] }),
  component: () => (
    <ClientShell allowInactive>
      <Page />
    </ClientShell>
  ),
});

function Page() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const signOut = useSignOut();
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    setName(me?.client?.full_name ?? "");
    setWa(me?.client?.whatsapp ?? "");
  }, [me]);

  const info = accessInfo(me?.client);

  async function save() {
    const { error } = await supabase.rpc("update_my_profile", { _full_name: name, _whatsapp: wa });
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Perfil atualizado.");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function changePw() {
    if (pw.length < 8) return void toast.error("A nova senha precisa ter 8+ caracteres.");
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as never);
    if (error) return void toast.error("Não foi possível alterar a senha.");
    toast.success("Senha alterada.");
    setCur("");
    setPw("");
  }

  return (
    <>
      <PageHeader eyebrow="Minha conta" title="Perfil" />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-card">
          <div className="space-y-1.5"><Label>Nome completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>E-mail</Label><Input value={me?.user.email ?? ""} disabled /></div>
          <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={wa} onChange={(e) => setWa(e.target.value)} /></div>
          <Button onClick={save}>Salvar</Button>
        </section>
        <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-card">
          <h2 className="text-xl font-semibold text-primary">Meu acesso</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">Status</dt><dd className="font-medium">{info.label}</dd>
            <dt className="text-muted-foreground">Última locação</dt><dd>{formatDate(me?.client?.last_rental_date)}</dd>
            <dt className="text-muted-foreground">Início do acesso</dt><dd>{formatDate(me?.client?.access_start_date)}</dd>
            <dt className="text-muted-foreground">Válido até</dt><dd>{formatDate(me?.client?.access_expires_at)}</dd>
          </dl>
          <h2 className="pt-2 text-xl font-semibold text-primary">Alterar senha</h2>
          <Input type="password" placeholder="Senha atual" value={cur} onChange={(e) => setCur(e.target.value)} />
          <Input type="password" placeholder="Nova senha" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={changePw}>Alterar senha</Button>
            <Button variant="ghost" onClick={signOut}>Sair</Button>
          </div>
        </section>
      </div>
    </>
  );
}

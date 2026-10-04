import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientShell } from "@/components/ClientShell";
import { PageHeader } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CHAMADO_CATEGORIAS, CHAMADO_STATUS, formatDate, useMe, whatsappUrl } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/suporte")({
  validateSearch: (s: Record<string, unknown>): { equipamento?: string | undefined } => ({
    equipamento: typeof s["equipamento"] === "string" ? (s["equipamento"] as string) : undefined,
  }),
  head: () => ({ meta: [{ title: "Suporte — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <Page />
    </ClientShell>
  ),
});

function Page() {
  const { equipamento } = Route.useSearch();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState({ assunto: "", categoria: CHAMADO_CATEGORIAS[0]!, mensagem: "", equipamento_id: equipamento ?? "" });
  const { data: equipamentos = [] } = useQuery({
    queryKey: ["equipamentos-visiveis"],
    queryFn: async () => (await supabase.from("equipamentos").select("*").eq("ativo", true).order("ordem")).data ?? [],
  });
  const { data: chamados = [] } = useQuery({
    queryKey: ["meus-chamados"],
    queryFn: async () => (await supabase.from("chamados").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.profile) return;
    if (!form.assunto.trim() || !form.mensagem.trim()) return void toast.error("Preencha assunto e mensagem.");
    const { error } = await supabase.from("chamados").insert({
      cliente_id: me.profile.id,
      assunto: form.assunto.trim().slice(0, 150),
      categoria: form.categoria,
      mensagem: form.mensagem.trim().slice(0, 3000),
      equipamento_id: form.equipamento_id || null,
    });
    if (error) return void toast.error("Não foi possível enviar.");
    toast.success("Chamado enviado!");
    setForm({ ...form, assunto: "", mensagem: "" });
    qc.invalidateQueries({ queryKey: ["meus-chamados"] });
  }

  const sel = "h-11 w-full rounded-md border bg-background px-3 text-sm";
  return (
    <>
      <PageHeader eyebrow="Suporte" title="Precisa de ajuda?" />
      <Button asChild variant="whatsapp" size="lg" className="mb-6">
        <a href={whatsappUrl("Olá! Sou cliente Sinoslaser e preciso de ajuda.")} target="_blank" rel="noreferrer"><MessageCircle /> Falar pelo WhatsApp</a>
      </Button>
      <form onSubmit={submit} className="space-y-3 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-xl font-semibold text-primary">Abrir chamado</h2>
        <Input placeholder="Assunto" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} />
        <select className={sel} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
          {CHAMADO_CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={sel} value={form.equipamento_id} onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })}>
          <option value="">Equipamento (opcional)</option>
          {equipamentos.map((eq) => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
        </select>
        <Textarea placeholder="Mensagem" rows={5} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} />
        <Button type="submit">Enviar chamado</Button>
      </form>
      <h2 className="mb-3 mt-8 text-xl font-semibold text-primary">Meus chamados</h2>
      <div className="space-y-3">
        {chamados.map((t) => (
          <div key={t.id} className="rounded-2xl border bg-card p-4">
            <div className="flex justify-between text-xs text-muted-foreground"><span>{t.categoria} · {formatDate(t.created_at)}</span><span className="font-medium text-primary">{CHAMADO_STATUS[t.status]}</span></div>
            <p className="mt-1 font-semibold text-primary">{t.assunto}</p>
            {t.resposta && <p className="mt-2 rounded-xl bg-primary-soft p-3 text-sm">{t.resposta}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

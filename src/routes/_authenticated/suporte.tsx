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
import { TICKET_CATEGORIES, TICKET_STATUS, formatDate, useMe, whatsappUrl } from "@/lib/data";
import { useMyEquipments } from "@/lib/client-queries";

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
  const { data: equipments = [] } = useMyEquipments();
  const qc = useQueryClient();
  const [form, setForm] = useState({ subject: "", category: TICKET_CATEGORIES[0]!, message: "", equipment_id: equipamento ?? "" });
  const { data: tickets = [] } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => (await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const wa = whatsappUrl(me?.settings?.support_whatsapp, "Olá! Sou cliente Sinoslaser e preciso de ajuda.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.client) return;
    if (!form.subject.trim() || !form.message.trim()) return void toast.error("Preencha assunto e mensagem.");
    const { error } = await supabase.from("support_tickets").insert({
      client_id: me.client.id,
      subject: form.subject.trim().slice(0, 150),
      category: form.category,
      message: form.message.trim().slice(0, 3000),
      equipment_id: form.equipment_id || null,
    });
    if (error) return void toast.error("Não foi possível enviar.");
    toast.success("Chamado enviado!");
    setForm({ ...form, subject: "", message: "" });
    qc.invalidateQueries({ queryKey: ["my-tickets"] });
  }

  return (
    <>
      <PageHeader eyebrow="Suporte" title="Precisa de ajuda?" />
      {wa && (
        <Button asChild variant="whatsapp" size="lg" className="mb-6">
          <a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> Falar pelo WhatsApp</a>
        </Button>
      )}
      <form onSubmit={submit} className="space-y-3 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-xl font-semibold text-primary">Abrir chamado</h2>
        <Input placeholder="Assunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}>
          <option value="">Equipamento (opcional)</option>
          {equipments.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
        </select>
        <Textarea placeholder="Mensagem" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <Button type="submit">Enviar chamado</Button>
      </form>
      <h2 className="mt-8 mb-3 text-xl font-semibold text-primary">Meus chamados</h2>
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-2xl border bg-card p-4">
            <div className="flex justify-between text-xs text-muted-foreground"><span>{t.category} · {formatDate(t.created_at)}</span><span className="font-medium text-primary">{TICKET_STATUS[t.status]}</span></div>
            <p className="mt-1 font-semibold text-primary">{t.subject}</p>
            {t.admin_response && <p className="mt-2 rounded-xl bg-primary-soft p-3 text-sm">{t.admin_response}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

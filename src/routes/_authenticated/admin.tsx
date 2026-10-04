import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark, EmptyState } from "@/components/brand";
import { Spinner, useSignOut } from "@/components/ClientShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, brl, CHAMADO_STATUS, daysUntil, formatDate, LOCACAO_STATUS, useMe, type Equipamento, type Profile } from "@/lib/data";
import { alterarSenhaCliente, criarCliente } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel admin — Sinoslaser" }] }),
  component: Admin,
});

const sel = "h-10 w-full rounded-md border bg-background px-3 text-sm";
const card = "rounded-2xl border bg-card p-4 shadow-card";

function useClientes() {
  return useQuery({
    queryKey: ["adm-clientes"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "cliente");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as Profile[];
      return (await supabase.from("profiles").select("*").in("id", ids).order("nome")).data ?? [];
    },
  });
}
function useEquipamentos() {
  return useQuery({ queryKey: ["adm-equip"], queryFn: async () => (await supabase.from("equipamentos").select("*").order("ordem")).data ?? [] });
}

function Admin() {
  const { data: me, isLoading } = useMe();
  const signOut = useSignOut();
  if (isLoading) return <Spinner />;
  if (!me?.isAdmin) return <EmptyState title="Acesso restrito" text="Esta área é só para administradores." />;
  const t = "rounded-full px-4 py-2";
  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="flex items-center justify-between border-b bg-card px-5 py-4 md:px-10">
        <Wordmark />
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/home"><Home /> Área do cliente</Link></Button>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut /> Sair</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        <h1 className="mb-6 text-3xl font-bold text-primary">Painel administrativo</h1>
        <Tabs defaultValue="clientes">
          <div className="-mx-5 overflow-x-auto px-5">
            <TabsList className="h-auto w-max gap-1 rounded-full bg-secondary p-1">
              <TabsTrigger value="clientes" className={t}>Clientes</TabsTrigger>
              <TabsTrigger value="locacoes" className={t}>Locações</TabsTrigger>
              <TabsTrigger value="equip" className={t}>Equipamentos</TabsTrigger>
              <TabsTrigger value="faq" className={t}>Perguntas</TabsTrigger>
              <TabsTrigger value="chamados" className={t}>Chamados</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="clientes" className="mt-6"><Clientes /></TabsContent>
          <TabsContent value="locacoes" className="mt-6"><Locacoes /></TabsContent>
          <TabsContent value="equip" className="mt-6"><Equipamentos /></TabsContent>
          <TabsContent value="faq" className="mt-6"><FaqAdmin /></TabsContent>
          <TabsContent value="chamados" className="mt-6"><Chamados /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Clientes() {
  const qc = useQueryClient();
  const criar = useServerFn(criarCliente);
  const trocarSenha = useServerFn(alterarSenhaCliente);
  const { data = [], isLoading } = useClientes();
  const [f, setF] = useState({ nome: "", usuario: "", senha: "", acesso_ate: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await criar({ data: { ...f, acesso_ate: f.acesso_ate || null } });
      toast.success("Cliente criada!");
      setF({ nome: "", usuario: "", senha: "", acesso_ate: "" });
      qc.invalidateQueries({ queryKey: ["adm-clientes"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar.");
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, patch: Partial<Profile>) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Salvo.");
    qc.invalidateQueries({ queryKey: ["adm-clientes"] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={submit} className={`${card} space-y-3 self-start`}>
        <h2 className="font-semibold text-primary">Nova cliente</h2>
        <Input placeholder="Nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required />
        <Input placeholder="Usuário (ex.: maria.silva)" value={f.usuario} onChange={(e) => setF({ ...f, usuario: e.target.value })} required />
        <Input placeholder="Senha (8+ caracteres)" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} required />
        <label className="block text-xs text-muted-foreground">Acesso até (opcional)<Input type="date" value={f.acesso_ate} onChange={(e) => setF({ ...f, acesso_ate: e.target.value })} /></label>
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Criando..." : "Criar cliente"}</Button>
      </form>
      <div className="space-y-3">
        {isLoading ? <Spinner /> : data.length === 0 ? <EmptyState title="Nenhuma cliente cadastrada" /> : data.map((c) => {
          const left = daysUntil(c.acesso_ate);
          const vencendo = left !== null && left >= 0 && left <= 7;
          return (
            <div key={c.id} className={`${card} ${vencendo ? "border-warning ring-1 ring-warning" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-primary">{c.nome} <span className="text-xs font-normal text-muted-foreground">@{c.usuario}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {c.acesso_ativo ? "Ativa" : "Bloqueada"} · acesso até {formatDate(c.acesso_ate)}
                    {vencendo && <span className="ml-2 font-semibold text-warning">vence em {left} dia(s)</span>}
                    {left !== null && left < 0 && <span className="ml-2 font-semibold text-destructive">vencido</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="date" className="h-9 w-40" defaultValue={c.acesso_ate ?? ""} onBlur={(e) => e.target.value !== (c.acesso_ate ?? "") && update(c.id, { acesso_ate: e.target.value || null })} />
                  <Button size="sm" variant={c.acesso_ativo ? "outline" : "default"} onClick={() => update(c.id, { acesso_ativo: !c.acesso_ativo })}>{c.acesso_ativo ? "Bloquear" : "Ativar"}</Button>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    const nome = prompt("Nome da cliente", c.nome);
                    if (nome && nome.trim() && nome !== c.nome) update(c.id, { nome: nome.trim() });
                  }}>Editar nome</Button>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    const s = prompt("Nova senha (8+ caracteres)");
                    if (!s) return;
                    try { await trocarSenha({ data: { id: c.id, senha: s } }); toast.success("Senha alterada."); } catch { toast.error("Senha inválida."); }
                  }}>Senha</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Locacoes() {
  const qc = useQueryClient();
  const { data: clientes = [] } = useClientes();
  const { data: equips = [] } = useEquipamentos();
  const { data = [], isLoading } = useQuery({
    queryKey: ["adm-locacoes"],
    queryFn: async () => (await supabase.from("locacoes").select("*, equipamentos(nome), profiles(nome, acesso_ate)").order("data_inicio", { ascending: false })).data ?? [],
  });
  const empty = { cliente_id: "", equipamento_id: "", data_inicio: "", data_fim: "", diarias_contratadas: "1", horas_por_diaria: "10", valor_diaria: "", status: "agendada" };
  const [f, setF] = useState(empty);
  const [encerrando, setEncerrando] = useState<{ id: string; cliente_id: string; ate: string } | null>(null);

  function pickEquip(id: string) {
    const eq = equips.find((e) => e.id === id);
    setF({ ...f, equipamento_id: id, valor_diaria: eq?.valor_diaria_padrao != null ? String(eq.valor_diaria_padrao) : f.valor_diaria });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.cliente_id || !f.equipamento_id || !f.data_inicio || !f.data_fim) return void toast.error("Preencha cliente, equipamento e datas.");
    if (f.data_fim < f.data_inicio) return void toast.error("Data final antes da inicial.");
    const { error } = await supabase.from("locacoes").insert({
      cliente_id: f.cliente_id, equipamento_id: f.equipamento_id, data_inicio: f.data_inicio, data_fim: f.data_fim,
      diarias_contratadas: Number(f.diarias_contratadas) || 1, horas_por_diaria: Number(f.horas_por_diaria), valor_diaria: Number(f.valor_diaria) || 0, status: f.status,
    });
    if (error) return void toast.error("Não foi possível criar.");
    toast.success("Locação criada!");
    setF(empty);
    qc.invalidateQueries({ queryKey: ["adm-locacoes"] });
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("locacoes").update({ status }).eq("id", id);
    if (error) return void toast.error("Erro ao atualizar.");
    qc.invalidateQueries({ queryKey: ["adm-locacoes"] });
  }

  async function confirmarEncerrar() {
    if (!encerrando) return;
    await setStatus(encerrando.id, "encerrada");
    const { error } = await supabase.from("profiles").update({ acesso_ate: encerrando.ate || null }).eq("id", encerrando.cliente_id);
    if (error) toast.error("Locação encerrada, mas não foi possível atualizar o acesso.");
    else toast.success("Locação encerrada e acesso atualizado.");
    setEncerrando(null);
    qc.invalidateQueries({ queryKey: ["adm-clientes"] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={submit} className={`${card} space-y-3 self-start`}>
        <h2 className="font-semibold text-primary">Nova locação</h2>
        <select className={sel} value={f.cliente_id} onChange={(e) => setF({ ...f, cliente_id: e.target.value })}>
          <option value="">Cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className={sel} value={f.equipamento_id} onChange={(e) => pickEquip(e.target.value)}>
          <option value="">Equipamento</option>{equips.filter((e) => e.ativo).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">Início<Input type="date" value={f.data_inicio} onChange={(e) => setF({ ...f, data_inicio: e.target.value })} /></label>
          <label className="text-xs text-muted-foreground">Fim<Input type="date" value={f.data_fim} onChange={(e) => setF({ ...f, data_fim: e.target.value })} /></label>
          <label className="text-xs text-muted-foreground">Nº de diárias<Input type="number" min={1} value={f.diarias_contratadas} onChange={(e) => setF({ ...f, diarias_contratadas: e.target.value })} /></label>
          <label className="text-xs text-muted-foreground">Horas/diária
            <select className={sel} value={f.horas_por_diaria} onChange={(e) => setF({ ...f, horas_por_diaria: e.target.value })}><option value="10">10h</option><option value="12">12h</option></select>
          </label>
          <label className="text-xs text-muted-foreground">Valor da diária (R$)<Input type="number" min={0} value={f.valor_diaria} onChange={(e) => setF({ ...f, valor_diaria: e.target.value })} /></label>
          <label className="text-xs text-muted-foreground">Status
            <select className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="agendada">Agendada</option><option value="ativa">Ativa</option></select>
          </label>
        </div>
        <Button type="submit" className="w-full">Criar locação</Button>
      </form>

      <div className="space-y-3">
        {encerrando && (
          <div className={`${card} border-primary`}>
            <p className="font-semibold text-primary">Encerrar locação</p>
            <p className="text-sm text-muted-foreground">Acesso da cliente até (sugestão: fim + 60 dias):</p>
            <div className="mt-2 flex gap-2">
              <Input type="date" className="w-44" value={encerrando.ate} onChange={(e) => setEncerrando({ ...encerrando, ate: e.target.value })} />
              <Button size="sm" onClick={confirmarEncerrar}>Confirmar</Button>
              <Button size="sm" variant="ghost" onClick={() => setEncerrando(null)}>Cancelar</Button>
            </div>
          </div>
        )}
        {isLoading ? <Spinner /> : data.length === 0 ? <EmptyState title="Nenhuma locação" /> : data.map((l) => (
          <div key={l.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-primary">{l.profiles?.nome} · {l.equipamentos?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(l.data_inicio)} → {formatDate(l.data_fim)} · {l.diarias_contratadas} diárias de {l.horas_por_diaria}h · {brl(Number(l.valor_diaria))}/diária
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">{LOCACAO_STATUS[l.status]}</span>
                {l.status === "agendada" && <Button size="sm" variant="outline" onClick={() => setStatus(l.id, "ativa")}>Ativar</Button>}
                {l.status !== "encerrada" && (
                  <Button size="sm" variant="ghost" onClick={() => setEncerrando({ id: l.id, cliente_id: l.cliente_id, ate: addDays(l.data_fim, 60) })}>Encerrar</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Equipamentos() {
  const { data = [], isLoading } = useEquipamentos();
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading) return <Spinner />;
  return (
    <div className="space-y-3">
      {data.map((e) => (
        <div key={e.id} className={card}>
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-primary">{e.nome} {!e.ativo && <span className="text-xs font-normal text-muted-foreground">(oculto)</span>}</p>
            <Button size="sm" variant="outline" onClick={() => setOpen(open === e.id ? null : e.id)}>{open === e.id ? "Fechar" : "Editar"}</Button>
          </div>
          {open === e.id && <EquipForm eq={e} onDone={() => setOpen(null)} />}
        </div>
      ))}
    </div>
  );
}

function EquipForm({ eq, onDone }: { eq: Equipamento; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    nome: eq.nome, descricao: eq.descricao ?? "", foto_url: eq.foto_url ?? "", link_treinamento: eq.link_treinamento ?? "",
    link_marketing: eq.link_marketing ?? "", valor_diaria_padrao: eq.valor_diaria_padrao != null ? String(eq.valor_diaria_padrao) : "", ativo: eq.ativo,
  });
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    let protocolo_pdf_path = eq.protocolo_pdf_path;
    if (pdf) {
      if (pdf.type !== "application/pdf") { setBusy(false); return void toast.error("Envie um arquivo PDF."); }
      const path = `${eq.slug}/${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("protocolos").upload(path, pdf, { contentType: "application/pdf" });
      if (error) { setBusy(false); return void toast.error("Falha no envio do PDF."); }
      protocolo_pdf_path = path;
    }
    const { error } = await supabase.from("equipamentos").update({
      nome: f.nome.trim(), descricao: f.descricao.trim() || null, foto_url: f.foto_url.trim() || null,
      link_treinamento: f.link_treinamento.trim() || null, link_marketing: f.link_marketing.trim() || null,
      valor_diaria_padrao: f.valor_diaria_padrao ? Number(f.valor_diaria_padrao) : null, ativo: f.ativo, protocolo_pdf_path,
    }).eq("id", eq.id);
    setBusy(false);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Equipamento salvo.");
    qc.invalidateQueries({ queryKey: ["adm-equip"] });
    onDone();
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <Input placeholder="Nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
      <Input placeholder="Valor padrão da diária (R$)" type="number" value={f.valor_diaria_padrao} onChange={(e) => setF({ ...f, valor_diaria_padrao: e.target.value })} />
      <Input placeholder="URL da foto" value={f.foto_url} onChange={(e) => setF({ ...f, foto_url: e.target.value })} />
      <Input placeholder="Link de treinamento (Drive/YouTube)" value={f.link_treinamento} onChange={(e) => setF({ ...f, link_treinamento: e.target.value })} />
      <Input placeholder="Link de marketing (Drive)" value={f.link_marketing} onChange={(e) => setF({ ...f, link_marketing: e.target.value })} />
      <label className="text-xs text-muted-foreground">PDF de protocolos {eq.protocolo_pdf_path && "(já enviado — envie outro para substituir)"}
        <Input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
      </label>
      <Textarea className="md:col-span-2" rows={4} placeholder="Descrição" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Ativo (visível para clientes)</label>
      <div className="md:col-span-2"><Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></div>
    </div>
  );
}

function FaqAdmin() {
  const qc = useQueryClient();
  const { data: equips = [] } = useEquipamentos();
  const { data = [] } = useQuery({ queryKey: ["adm-faq"], queryFn: async () => (await supabase.from("faq").select("*, equipamentos(nome)").order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ equipamento_id: "", pergunta: "", resposta: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.pergunta.trim() || !f.resposta.trim()) return;
    const { error } = await supabase.from("faq").insert({ equipamento_id: f.equipamento_id || null, pergunta: f.pergunta.trim(), resposta: f.resposta.trim() });
    if (error) return void toast.error("Erro ao salvar.");
    setF({ ...f, pergunta: "", resposta: "" });
    qc.invalidateQueries({ queryKey: ["adm-faq"] });
  }
  async function del(id: string) {
    await supabase.from("faq").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["adm-faq"] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={add} className={`${card} space-y-3 self-start`}>
        <h2 className="font-semibold text-primary">Nova pergunta</h2>
        <select className={sel} value={f.equipamento_id} onChange={(e) => setF({ ...f, equipamento_id: e.target.value })}>
          <option value="">Geral (todos)</option>{equips.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <Input placeholder="Pergunta" value={f.pergunta} onChange={(e) => setF({ ...f, pergunta: e.target.value })} />
        <Textarea placeholder="Resposta" rows={4} value={f.resposta} onChange={(e) => setF({ ...f, resposta: e.target.value })} />
        <Button type="submit" className="w-full">Adicionar</Button>
      </form>
      <div className="space-y-3">
        {data.length === 0 ? <EmptyState title="Nenhuma pergunta" /> : data.map((q) => (
          <div key={q.id} className={card}>
            <p className="text-xs text-muted-foreground">{q.equipamentos?.nome ?? "Geral"}</p>
            <p className="font-semibold text-primary">{q.pergunta}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{q.resposta}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => del(q.id)}>Excluir</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chamados() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["adm-chamados"],
    queryFn: async () => (await supabase.from("chamados").select("*, profiles(nome), equipamentos(nome)").order("created_at", { ascending: false })).data ?? [],
  });
  async function update(id: string, patch: { status?: string; resposta?: string }) {
    const { error } = await supabase.from("chamados").update(patch).eq("id", id);
    if (error) return void toast.error("Erro ao salvar.");
    toast.success("Salvo.");
    qc.invalidateQueries({ queryKey: ["adm-chamados"] });
  }
  if (isLoading) return <Spinner />;
  if (!data.length) return <EmptyState title="Nenhum chamado" />;
  return (
    <div className="space-y-3">
      {data.map((c) => (
        <div key={c.id} className={card}>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>{c.profiles?.nome} · {c.categoria}{c.equipamentos?.nome ? ` · ${c.equipamentos.nome}` : ""} · {formatDate(c.created_at)}</span>
            <select className="h-8 rounded-md border bg-background px-2 text-xs" value={c.status} onChange={(e) => update(c.id, { status: e.target.value })}>
              {Object.entries(CHAMADO_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <p className="mt-1 font-semibold text-primary">{c.assunto}</p>
          <p className="mt-1 whitespace-pre-line text-sm">{c.mensagem}</p>
          <Textarea className="mt-3" rows={2} placeholder="Resposta" defaultValue={c.resposta ?? ""} onBlur={(e) => e.target.value !== (c.resposta ?? "") && update(c.id, { resposta: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

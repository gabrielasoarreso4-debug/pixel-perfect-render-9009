import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Paperclip, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/brand";
import { SECOES, TIPO_ICON, type Material, type Secao } from "@/components/Biblioteca";

const sel = "h-10 w-full rounded-md border bg-background px-3 text-sm";
const card = "rounded-2xl border bg-card p-4 shadow-card";

function tipoDoArquivo(f: File) {
  if (f.type.startsWith("video/")) return "video";
  if (f.type === "application/pdf") return "pdf";
  if (f.type.startsWith("image/")) return "imagem";
  return "arquivo";
}

export function MateriaisAdmin() {
  const qc = useQueryClient();
  const { data: equips = [] } = useQuery({ queryKey: ["adm-equip"], queryFn: async () => (await supabase.from("equipamentos").select("*").order("ordem")).data ?? [] });
  const { data = [] } = useQuery({
    queryKey: ["adm-materiais"],
    queryFn: async () => ((await supabase.from("materiais").select("*, equipamentos(nome)").order("ordem").order("created_at")).data ?? []) as Material[],
  });
  const [secao, setSecao] = useState<Secao>("treinamento");
  const empty = { equipamento_id: "", titulo: "", descricao: "", categoria: "", duracao: "", link_url: "" };
  const [f, setF] = useState(empty);
  const [files, setFiles] = useState<File[]>([]);
  const [prog, setProg] = useState<number | null>(null);

  const refresh = () => { qc.invalidateQueries({ queryKey: ["adm-materiais"] }); qc.invalidateQueries({ queryKey: ["materiais"] }); };

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length && !f.link_url.trim()) return void toast.error("Escolha um arquivo ou cole um link.");
    if (!files.length && !f.titulo.trim()) return void toast.error("Dê um título.");
    const base = data.filter((m) => m.secao === secao).length;
    const comum = { secao, equipamento_id: f.equipamento_id || null, descricao: f.descricao.trim() || null, categoria: f.categoria.trim() || null, duracao: f.duracao.trim() || null };
    if (!files.length) {
      const { error } = await supabase.from("materiais").insert({ ...comum, titulo: f.titulo.trim(), tipo: "link", link_url: f.link_url.trim(), ordem: base });
      if (error) return void toast.error("Não foi possível salvar.");
    } else {
      setProg(0);
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${secao}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("materiais").upload(path, file, { contentType: file.type || undefined });
        if (up.error) { setProg(null); return void toast.error(`Falha ao enviar ${file.name}.`); }
        const titulo = files.length === 1 && f.titulo.trim() ? f.titulo.trim() : file.name.replace(/\.[^.]+$/, "");
        const { error } = await supabase.from("materiais").insert({ ...comum, titulo, tipo: tipoDoArquivo(file), arquivo_path: path, ordem: base + i });
        if (error) { setProg(null); return void toast.error("Arquivo enviado, mas não salvo."); }
        setProg(((i + 1) / files.length) * 100);
      }
      setProg(null);
    }
    toast.success("Material adicionado!");
    setF({ ...empty, equipamento_id: f.equipamento_id, categoria: f.categoria });
    setFiles([]);
    (e.target as HTMLFormElement).reset();
    refresh();
  }

  async function del(m: Material) {
    if (!confirm(`Excluir "${m.titulo}"?`)) return;
    if (m.arquivo_path) await supabase.storage.from("materiais").remove([m.arquivo_path]);
    await supabase.from("materiais").delete().eq("id", m.id);
    refresh();
  }

  async function mover(lista: Material[], i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= lista.length) return;
    const nova = [...lista];
    [nova[i], nova[j]] = [nova[j]!, nova[i]!];
    await Promise.all(nova.map((m, k) => supabase.from("materiais").update({ ordem: k }).eq("id", m.id)));
    refresh();
  }

  async function renomear(m: Material, titulo: string) {
    if (!titulo.trim() || titulo === m.titulo) return;
    await supabase.from("materiais").update({ titulo: titulo.trim() }).eq("id", m.id);
    refresh();
  }

  const lista = data.filter((m) => m.secao === secao);
  const accept = secao === "treinamento" ? "video/*,application/pdf" : secao === "protocolo" ? "application/pdf,image/*,.doc,.docx" : "image/*,video/*,application/pdf,.zip";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SECOES) as Secao[]).map((s) => (
          <button key={s} onClick={() => setSecao(s)} className={`rounded-full border px-4 py-2 text-sm font-medium ${secao === s ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
            {SECOES[s].label} ({data.filter((m) => m.secao === s).length})
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={add} className={`${card} space-y-3 self-start`}>
          <h2 className="font-semibold text-primary">Adicionar em {SECOES[secao].label}</h2>
          <select className={sel} value={f.equipamento_id} onChange={(e) => setF({ ...f, equipamento_id: e.target.value })}>
            <option value="">Geral (todas as clientes)</option>{equips.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
          <label className="block rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            <Paperclip className="mx-auto mb-1 size-5 text-primary" />
            {files.length ? `${files.length} arquivo(s) selecionado(s)` : secao === "treinamento" ? "Enviar vídeos das aulas ou PDFs" : "Enviar PDFs, imagens ou arquivos"}
            <input type="file" multiple accept={accept} className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </label>
          <Input placeholder="ou cole um link (YouTube, Drive...)" value={f.link_url} onChange={(e) => setF({ ...f, link_url: e.target.value })} />
          <Input placeholder={files.length > 1 ? "Título (usa o nome de cada arquivo)" : "Título"} disabled={files.length > 1} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Categoria (ex.: Módulo 1)" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} />
            <Input placeholder="Duração (ex.: 12 min)" value={f.duracao} onChange={(e) => setF({ ...f, duracao: e.target.value })} />
          </div>
          <Textarea rows={3} placeholder="Descrição (opcional)" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          {prog !== null && <div className="space-y-1"><Progress value={prog} /><p className="text-xs text-muted-foreground">Enviando... vídeos grandes podem demorar.</p></div>}
          <Button type="submit" className="w-full" disabled={prog !== null}>{prog !== null ? "Enviando..." : "Adicionar"}</Button>
        </form>
        <div className="space-y-2">
          {!lista.length ? <EmptyState title="Nenhum material nesta seção" /> : lista.map((m, i) => {
            const Icon = TIPO_ICON[m.tipo as keyof typeof TIPO_ICON] ?? Paperclip;
            return (
              <div key={m.id} className={`${card} flex items-center gap-3`}>
                <Icon className="size-6 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <input className="w-full truncate bg-transparent font-semibold text-primary outline-none focus:underline" defaultValue={m.titulo} onBlur={(e) => renomear(m, e.target.value)} />
                  <p className="truncate text-xs text-muted-foreground">{m.equipamentos?.nome ?? "Geral"}{m.categoria ? ` · ${m.categoria}` : ""}{m.duracao ? ` · ${m.duracao}` : ""}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => mover(lista, i, -1)} disabled={i === 0} aria-label="Subir"><ArrowUp /></Button>
                <Button size="icon" variant="ghost" onClick={() => mover(lista, i, 1)} disabled={i === lista.length - 1} aria-label="Descer"><ArrowDown /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(m)} aria-label="Excluir"><Trash2 /></Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

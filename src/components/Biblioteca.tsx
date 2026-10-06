import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Download, ExternalLink, FileText, Image as ImageIcon, Link2, Paperclip, PlayCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/brand";
import { Spinner } from "@/components/ClientShell";
import { embedUrl } from "@/lib/data";

export type Material = Database["public"]["Tables"]["materiais"]["Row"] & { equipamentos?: { nome: string } | null };
export type Secao = "treinamento" | "protocolo" | "marketing";

export const SECOES: Record<Secao, { label: string; vazio: string }> = {
  treinamento: { label: "Treinamentos", vazio: "As aulas gravadas aparecerão aqui." },
  protocolo: { label: "Protocolos e documentos", vazio: "Os protocolos e documentos aparecerão aqui." },
  marketing: { label: "Marketing", vazio: "Artes, PDFs e materiais de divulgação aparecerão aqui." },
};

export const TIPO_ICON = { video: PlayCircle, pdf: FileText, imagem: ImageIcon, arquivo: Paperclip, link: Link2 } as const;
const TIPO_LABEL = { video: "Aula", pdf: "PDF", imagem: "Imagem", arquivo: "Arquivo", link: "Link" } as const;

export function useMateriais(equipamentoId?: string) {
  return useQuery({
    queryKey: ["materiais", equipamentoId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("materiais").select("*, equipamentos(nome)").order("ordem").order("created_at");
      if (equipamentoId) q = q.or(`equipamento_id.eq.${equipamentoId},equipamento_id.is.null`);
      return ((await q).data ?? []) as Material[];
    },
  });
}

function useProgresso() {
  return useQuery({
    queryKey: ["progresso"],
    queryFn: async () => new Set(((await supabase.from("materiais_progresso").select("material_id")).data ?? []).map((r) => r.material_id)),
  });
}

export async function signedUrl(path: string, download?: boolean) {
  const { data } = await supabase.storage.from("materiais").createSignedUrl(path, 3600, download ? { download: true } : undefined);
  return data?.signedUrl ?? null;
}

export function Biblioteca({ secao, materiais, loading }: { secao: Secao; materiais: Material[]; loading?: boolean }) {
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState<string>("Todos");
  const [aberto, setAberto] = useState<Material | null>(null);
  const { data: feitos = new Set<string>() } = useProgresso();

  const itens = materiais.filter((m) => m.secao === secao);
  const cats = useMemo(() => ["Todos", ...Array.from(new Set(itens.map((m) => m.categoria || "Geral")))], [itens]);
  const visiveis = itens.filter(
    (m) => (cat === "Todos" || (m.categoria || "Geral") === cat) && (!busca || `${m.titulo} ${m.descricao ?? ""}`.toLowerCase().includes(busca.toLowerCase())),
  );

  if (loading) return <Spinner />;
  if (!itens.length) return <EmptyState title="Em breve" text={SECOES[secao].vazio} />;

  const concluidos = itens.filter((m) => feitos.has(m.id)).length;
  const grupos = visiveis.reduce<Record<string, Material[]>>((acc, m) => ((acc[m.categoria || "Geral"] ??= []).push(m), acc), {});

  return (
    <div className="space-y-5">
      {secao === "treinamento" && (
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-primary">Seu progresso</span><span className="text-muted-foreground">{concluidos} de {itens.length} aulas</span></div>
          <Progress value={(concluidos / itens.length) * 100} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="rounded-full pl-9" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {cats.length > 2 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{c}</button>
            ))}
          </div>
        )}
      </div>
      {Object.entries(grupos).map(([g, lista]) => (
        <section key={g}>
          {Object.keys(grupos).length > 1 && <h3 className="mb-3 font-display font-semibold text-primary">{g}</h3>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((m, i) => <Card key={m.id} m={m} n={secao === "treinamento" ? i + 1 : undefined} feito={feitos.has(m.id)} onOpen={() => setAberto(m)} />)}
          </div>
        </section>
      ))}
      {!visiveis.length && <EmptyState title="Nada encontrado" />}
      <Viewer m={aberto} feito={aberto ? feitos.has(aberto.id) : false} onClose={() => setAberto(null)} />
    </div>
  );
}

function Card({ m, n, feito, onOpen }: { m: Material; n?: number; feito: boolean; onOpen: () => void }) {
  const Icon = TIPO_ICON[m.tipo as keyof typeof TIPO_ICON] ?? Paperclip;
  return (
    <button onClick={onOpen} className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary">
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-primary-soft to-secondary">
        <Icon className="size-12 text-primary transition group-hover:scale-110" />
        <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-primary">{n ? `Aula ${n}` : TIPO_LABEL[m.tipo as keyof typeof TIPO_LABEL]}</span>
        {feito && <CheckCircle2 className="absolute right-3 top-3 size-5 text-primary" />}
      </div>
      <div className="flex-1 p-4">
        <p className="font-semibold text-primary">{m.titulo}</p>
        {m.descricao && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.descricao}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{m.equipamentos?.nome ?? "Geral"}{m.duracao ? ` · ${m.duracao}` : ""}</p>
      </div>
    </button>
  );
}

function Viewer({ m, feito, onClose }: { m: Material | null; feito: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: url, isLoading } = useQuery({
    queryKey: ["mat-url", m?.id],
    enabled: !!m?.arquivo_path,
    staleTime: 30 * 60 * 1000,
    queryFn: () => signedUrl(m!.arquivo_path!),
  });

  async function toggle() {
    if (!m) return;
    if (feito) await supabase.from("materiais_progresso").delete().eq("material_id", m.id);
    else await supabase.from("materiais_progresso").insert({ material_id: m.id });
    qc.invalidateQueries({ queryKey: ["progresso"] });
  }
  async function baixar() {
    if (!m?.arquivo_path) return;
    const u = await signedUrl(m.arquivo_path, true);
    if (u) window.location.href = u;
  }

  const src = m?.link_url || url;
  const embed = m?.link_url ? embedUrl(m.link_url) : null;

  return (
    <Dialog open={!!m} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[95vh] w-[96vw] max-w-5xl overflow-y-auto">
        {m && (
          <>
            <DialogHeader>
              <DialogTitle className="text-primary">{m.titulo}</DialogTitle>
              {m.descricao && <DialogDescription className="whitespace-pre-line">{m.descricao}</DialogDescription>}
            </DialogHeader>
            {isLoading ? <Spinner /> : !src ? <EmptyState title="Arquivo indisponível" /> : (
              <div className="overflow-hidden rounded-xl border bg-muted">
                {m.tipo === "video" && !m.link_url && <video src={src} controls controlsList="nodownload" playsInline className="aspect-video w-full bg-foreground" />}
                {m.link_url && embed && <iframe src={embed} title={m.titulo} className="aspect-video w-full" allow="autoplay; fullscreen" allowFullScreen />}
                {m.tipo === "pdf" && !m.link_url && <iframe src={src} title={m.titulo} className="h-[70vh] w-full bg-card" />}
                {m.tipo === "imagem" && !m.link_url && <img src={src} alt={m.titulo} className="mx-auto max-h-[70vh] object-contain" />}
                {(m.tipo === "arquivo" || (m.link_url && !embed)) && (
                  <div className="p-8 text-center text-sm text-muted-foreground">Abra ou baixe o material pelos botões abaixo.</div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant={feito ? "outline" : "default"} onClick={toggle}>{feito ? <CheckCircle2 /> : <Circle />} {feito ? "Concluído" : "Marcar como concluído"}</Button>
              {m.arquivo_path && m.tipo !== "video" && <Button variant="outline" onClick={baixar}><Download /> Baixar</Button>}
              {m.link_url && <Button asChild variant="outline"><a href={m.link_url} target="_blank" rel="noreferrer"><ExternalLink /> Abrir link</a></Button>}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

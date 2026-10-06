import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ClientShell } from "@/components/ClientShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Biblioteca, SECOES, useMateriais, type Secao } from "@/components/Biblioteca";

export const Route = createFileRoute("/_authenticated/conteudos")({
  validateSearch: z.object({ secao: z.enum(["treinamento", "protocolo", "marketing"]).optional() }),
  head: () => ({ meta: [{ title: "Conteúdos — Sinoslaser" }, { name: "description", content: "Treinamentos, protocolos e materiais de marketing Sinoslaser." }] }),
  component: () => (
    <ClientShell>
      <Conteudos />
    </ClientShell>
  ),
});

function Conteudos() {
  const { secao } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data = [], isLoading } = useMateriais();
  const t = "rounded-full px-4 py-2";
  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold text-primary md:text-4xl">Conteúdos</h1>
      <p className="mb-5 text-muted-foreground">Aulas, protocolos e materiais para você aproveitar ao máximo seu equipamento.</p>
      <Tabs value={secao ?? "treinamento"} onValueChange={(v) => navigate({ search: { secao: v as Secao }, replace: true })}>
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <TabsList className="h-auto w-max gap-1 rounded-full bg-secondary p-1">
            {(Object.keys(SECOES) as Secao[]).map((s) => <TabsTrigger key={s} value={s} className={t}>{SECOES[s].label}</TabsTrigger>)}
          </TabsList>
        </div>
        {(Object.keys(SECOES) as Secao[]).map((s) => (
          <TabsContent key={s} value={s} className="mt-6"><Biblioteca secao={s} materiais={data} loading={isLoading} /></TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink, LifeBuoy, MessageCircle, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientShell, Spinner } from "@/components/ClientShell";
import { EmptyState, EquipmentImage } from "@/components/brand";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { embedUrl, useMe, whatsappUrl } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/equipamentos/$id")({
  head: () => ({ meta: [{ title: "Equipamento — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <Detail />
    </ClientShell>
  ),
});

function Detail() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const { data: eq, isLoading } = useQuery({
    queryKey: ["equipamento", id],
    queryFn: async () => (await supabase.from("equipamentos").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: faq = [] } = useQuery({
    queryKey: ["faq", id],
    queryFn: async () => (await supabase.from("faq").select("*").or(`equipamento_id.eq.${id},equipamento_id.is.null`).order("created_at")).data ?? [],
  });
  const { data: locacao } = useQuery({
    queryKey: ["locacao-eq", id, me?.profile?.id],
    enabled: !!me?.profile,
    queryFn: async () =>
      (await supabase.from("locacoes").select("*").eq("equipamento_id", id).eq("cliente_id", me!.profile!.id).order("data_inicio", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const { data: pdfUrl } = useQuery({
    queryKey: ["pdf", eq?.protocolo_pdf_path],
    enabled: !!eq?.protocolo_pdf_path,
    queryFn: async () => (await supabase.storage.from("protocolos").createSignedUrl(eq!.protocolo_pdf_path!, 3600)).data?.signedUrl ?? null,
  });

  if (isLoading) return <Spinner />;
  if (!eq) return <EmptyState title="Equipamento não disponível" text="Este equipamento não está vinculado à sua conta." />;

  const embed = eq.link_treinamento ? embedUrl(eq.link_treinamento) : null;
  const tab = "rounded-full px-4 py-2";

  return (
    <div>
      <Link to="/equipamentos" className="mb-4 inline-flex items-center gap-1 text-sm text-lavender"><ArrowLeft className="size-4" /> Equipamentos</Link>
      <h1 className="mb-5 text-3xl font-bold text-primary md:text-4xl">{eq.nome}</h1>

      <Tabs defaultValue="geral">
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <TabsList className="h-auto w-max gap-1 rounded-full bg-secondary p-1">
            <TabsTrigger value="geral" className={tab}>Visão geral</TabsTrigger>
            <TabsTrigger value="calc" className={tab}>Calculadora</TabsTrigger>
            <TabsTrigger value="treino" className={tab}>Treinamento</TabsTrigger>
            <TabsTrigger value="protocolos" className={tab}>Protocolos</TabsTrigger>
            <TabsTrigger value="marketing" className={tab}>Marketing</TabsTrigger>
            <TabsTrigger value="faq" className={tab}>Perguntas frequentes</TabsTrigger>
            <TabsTrigger value="suporte" className={tab}>Suporte</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral" className="mt-6">
          <div className="overflow-hidden rounded-[2rem] border bg-card shadow-card">
            <div className="aspect-[16/10] md:aspect-[21/9]"><EquipmentImage equipment={eq} /></div>
            <div className="p-6">
              {eq.descricao ? <p className="whitespace-pre-line leading-relaxed">{eq.descricao}</p> : <p className="text-muted-foreground">Descrição em breve.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calc" className="mt-6">
          <RevenueCalculator key={locacao?.id ?? "x"} aluguelPadrao={locacao?.valor_diaria ?? eq.valor_diaria_padrao} locacaoId={locacao?.id} />
        </TabsContent>

        <TabsContent value="treino" className="mt-6">
          {eq.link_treinamento ? (
            <div className="space-y-4">
              {embed && <div className="aspect-video overflow-hidden rounded-2xl border bg-card"><iframe src={embed} title="Videoaula" className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen /></div>}
              <Button asChild><a href={eq.link_treinamento} target="_blank" rel="noreferrer"><PlayCircle /> Assistir videoaula</a></Button>
            </div>
          ) : <EmptyState title="Treinamento em breve" />}
        </TabsContent>

        <TabsContent value="protocolos" className="mt-6">
          {pdfUrl ? (
            <div className="space-y-4">
              <iframe src={pdfUrl} title="Protocolos" className="h-[70vh] w-full rounded-2xl border bg-card" />
              <Button asChild variant="outline"><a href={pdfUrl} target="_blank" rel="noreferrer" download><Download /> Baixar PDF</a></Button>
            </div>
          ) : <EmptyState title="Protocolos em breve" />}
        </TabsContent>

        <TabsContent value="marketing" className="mt-6">
          {eq.link_marketing ? (
            <div className="rounded-3xl border bg-card p-6 shadow-card">
              <h2 className="text-xl font-semibold text-primary">Materiais para divulgar seu procedimento</h2>
              <Button asChild className="mt-4"><a href={eq.link_marketing} target="_blank" rel="noreferrer"><ExternalLink /> Abrir materiais</a></Button>
            </div>
          ) : <EmptyState title="Materiais em breve" />}
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          {faq.length ? (
            <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
              {faq.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left font-medium text-primary">{f.pergunta}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-muted-foreground">{f.resposta}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : <EmptyState title="Nenhuma pergunta cadastrada ainda" />}
        </TabsContent>

        <TabsContent value="suporte" className="mt-6">
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="text-2xl font-bold text-primary">Precisa de ajuda com o {eq.nome}?</h2>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="whatsapp"><a href={whatsappUrl(`Olá! Preciso de ajuda com o ${eq.nome}.`)} target="_blank" rel="noreferrer"><MessageCircle /> Falar pelo WhatsApp</a></Button>
              <Button asChild variant="outline"><Link to="/suporte" search={{ equipamento: eq.id }}><LifeBuoy /> Abrir chamado</Link></Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

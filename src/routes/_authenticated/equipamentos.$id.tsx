import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, MessageCircle, LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientShell } from "@/components/ClientShell";
import { EmptyState, EquipmentImage } from "@/components/brand";
import { ContentList } from "@/components/ContentList";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SECTIONS, useMe, whatsappUrl, type SectionKey } from "@/lib/data";
import { useContents } from "@/lib/client-queries";

export const Route = createFileRoute("/_authenticated/equipamentos/$id")({
  head: () => ({ meta: [{ title: "Equipamento — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <Detail />
    </ClientShell>
  ),
});

const TAB_SECTIONS: SectionKey[] = ["treinamento", "protocolo", "video", "material", "marketing", "faq"];

function Detail() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const { data: eq, isLoading } = useQuery({
    queryKey: ["equipment", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipments").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: contents = [] } = useContents({ equipmentId: id });

  useEffect(() => {
    if (eq && me?.client && !me.isAdmin) {
      supabase.from("equipment_views").insert({ client_id: me.client.id, equipment_id: eq.id }).then(() => {});
    }
  }, [eq, me]);

  if (isLoading) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />;
  if (!eq) return <EmptyState title="Equipamento não disponível" text="Este equipamento não está liberado para sua conta." />;

  const wa = whatsappUrl(me?.settings?.support_whatsapp, `Olá! Preciso de ajuda com o equipamento ${eq.name}.`);

  return (
    <div>
      <Link to="/equipamentos" className="mb-4 inline-flex items-center gap-1 text-sm text-lavender">
        <ArrowLeft className="size-4" /> Meus equipamentos
      </Link>
      <div className="overflow-hidden rounded-[2rem] border bg-card shadow-card">
        <div className="aspect-[16/10] md:aspect-[21/9]">
          <EquipmentImage equipment={eq} />
        </div>
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-primary md:text-4xl">{eq.name}</h1>
          {eq.short_description && <p className="mt-2 text-lg text-primary/80">{eq.short_description}</p>}
        </div>
      </div>

      <Tabs defaultValue="geral" className="mt-6">
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <TabsList className="h-auto w-max gap-1 rounded-full bg-secondary p-1">
            <TabsTrigger value="geral" className="rounded-full px-4 py-2">Visão geral</TabsTrigger>
            {TAB_SECTIONS.map((s) => (
              <TabsTrigger key={s} value={s} className="rounded-full px-4 py-2">{SECTIONS[s].label}</TabsTrigger>
            ))}
            <TabsTrigger value="suporte" className="rounded-full px-4 py-2">Suporte</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral" className="mt-6 space-y-6">
          {eq.description ? (
            <p className="whitespace-pre-line leading-relaxed text-foreground/85">{eq.description}</p>
          ) : (
            <p className="text-muted-foreground">A descrição deste equipamento será publicada em breve.</p>
          )}
          <RevenueCalculator
            key={eq.id}
            defaults={{ price: eq.default_procedure_price, perDay: eq.default_procedures_per_day, days: eq.default_days_per_month }}
          />
        </TabsContent>

        {TAB_SECTIONS.map((s) => (
          <TabsContent key={s} value={s} className="mt-6">
            <ContentList section={s} items={contents.filter((c) => c.section === s)} />
          </TabsContent>
        ))}

        <TabsContent value="suporte" className="mt-6">
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="text-2xl font-bold text-primary">Precisa de ajuda com o {eq.name}?</h2>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {wa && (
                <Button asChild variant="whatsapp"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> Falar pelo WhatsApp</a></Button>
              )}
              <Button asChild variant="outline"><Link to="/suporte" search={{ equipamento: eq.id }}><LifeBuoy /> Abrir chamado</Link></Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

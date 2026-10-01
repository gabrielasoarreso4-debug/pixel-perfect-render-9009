import { createFileRoute } from "@tanstack/react-router";
import { ClientShell } from "@/components/ClientShell";
import { PageHeader } from "@/components/brand";
import { ContentList } from "@/components/ContentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SECTIONS, type SectionKey } from "@/lib/data";
import { useContents } from "@/lib/client-queries";

const KEYS = Object.keys(SECTIONS) as SectionKey[];

export const Route = createFileRoute("/_authenticated/conteudos")({
  validateSearch: (s: Record<string, unknown>): { s?: SectionKey | undefined } => ({
    s: KEYS.includes(s["s"] as SectionKey) ? (s["s"] as SectionKey) : undefined,
  }),
  head: () => ({ meta: [{ title: "Conteúdos — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <Page />
    </ClientShell>
  ),
});

function Page() {
  const { s } = Route.useSearch();
  const { data = [] } = useContents();
  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Conteúdos" />
      <Tabs defaultValue={s ?? "treinamento"}>
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <TabsList className="h-auto w-max gap-1 rounded-full bg-secondary p-1">
            {KEYS.map((k) => (
              <TabsTrigger key={k} value={k} className="rounded-full px-4 py-2">{SECTIONS[k].label}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {KEYS.map((k) => (
          <TabsContent key={k} value={k} className="mt-6">
            <ContentList section={k} showEquipment items={data.filter((c) => c.section === k)} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

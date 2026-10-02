import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientShell, Spinner } from "@/components/ClientShell";
import { EmptyState, EquipmentImage, PageHeader } from "@/components/brand";

export const Route = createFileRoute("/_authenticated/equipamentos/")({
  head: () => ({ meta: [{ title: "Meus equipamentos — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <List />
    </ClientShell>
  ),
});

function List() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["equipamentos-visiveis"],
    queryFn: async () => (await supabase.from("equipamentos").select("*").eq("ativo", true).order("ordem")).data ?? [],
  });
  return (
    <>
      <PageHeader eyebrow="Seus equipamentos" title="Equipamentos" />
      {isLoading ? <Spinner /> : data.length === 0 ? (
        <EmptyState title="Nenhum equipamento vinculado" text="Fale com a Sinoslaser para registrar sua locação." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((e) => (
            <Link key={e.id} to="/equipamentos/$id" params={{ id: e.id }} className="group overflow-hidden rounded-3xl border bg-card shadow-card">
              <div className="aspect-[4/3] overflow-hidden"><EquipmentImage equipment={e} className="transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="flex items-center justify-between gap-3 p-5">
                <h3 className="text-lg font-semibold text-primary">{e.nome}</h3>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><ArrowRight className="size-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

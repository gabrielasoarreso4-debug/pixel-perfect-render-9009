import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, FileText, GraduationCap, LifeBuoy, Megaphone, Sparkles } from "lucide-react";
import { ClientShell } from "@/components/ClientShell";
import { EmptyState, EquipmentImage } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/data";
import { useMyEquipments } from "@/lib/client-queries";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Início — Sinoslaser Área do Cliente" }] }),
  component: () => (
    <ClientShell>
      <Home />
    </ClientShell>
  ),
});

const SHORTCUTS = [
  { to: "/equipamentos", label: "Meus equipamentos", icon: Sparkles, search: undefined },
  { to: "/conteudos", label: "Cursos", icon: GraduationCap, search: { s: "treinamento" } },
  { to: "/conteudos", label: "Protocolos", icon: FileText, search: { s: "protocolo" } },
  { to: "/conteudos", label: "Marketing", icon: Megaphone, search: { s: "marketing" } },
  { to: "/calculadora", label: "Calculadora", icon: Calculator, search: undefined },
  { to: "/suporte", label: "Suporte", icon: LifeBuoy, search: undefined },
] as const;

function Home() {
  const { data: me } = useMe();
  const { data: equipments = [], isLoading } = useMyEquipments();
  const firstName = (me?.client?.full_name || me?.user.user_metadata?.full_name || "").split(" ")[0];

  return (
    <div className="space-y-10">
      <section>
        <p className="eyebrow">Área do cliente</p>
        <h1 className="mt-1 text-4xl font-bold text-primary md:text-5xl">Olá{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mt-2 text-muted-foreground">Que bom ter você aqui. Seus treinamentos e materiais estão a um toque.</p>
      </section>

      <section className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            search={s.search as never}
            className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-2 py-4 text-center shadow-card transition-transform hover:-translate-y-0.5"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft">
              <s.icon className="size-5 text-primary" />
            </span>
            <span className="text-xs font-medium text-primary">{s.label}</span>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-primary">Meus equipamentos</h2>
          <Link to="/equipamentos" className="text-sm font-medium text-lavender">Ver todos</Link>
        </div>
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        ) : equipments.length === 0 ? (
          <EmptyState title="Nenhum equipamento liberado" text="Os equipamentos aparecem aqui assim que a locação é registrada." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {equipments.slice(0, 6).map((e) => (
              <article key={e.id} className="overflow-hidden rounded-3xl border bg-card shadow-card">
                <div className="aspect-[4/3]">
                  <EquipmentImage equipment={e} />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-primary">{e.name}</h3>
                  {e.short_description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.short_description}</p>}
                  <Button asChild className="mt-4 w-full">
                    <Link to="/equipamentos/$id" params={{ id: e.id }}>
                      Acessar equipamento <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-brand p-7 text-primary-foreground md:p-10">
        <div className="absolute -right-16 -top-16 size-72 rounded-full border border-primary-foreground/25" />
        <p className="relative text-xs uppercase tracking-[0.22em] opacity-80">Sinoslaser</p>
        <h2 className="relative mt-2 max-w-md text-3xl font-bold">Potencialize os resultados da sua clínica</h2>
        <p className="relative mt-3 max-w-lg opacity-90">
          Equipamentos de alta tecnologia, treinamento e materiais de divulgação para levar sua clínica para outro
          nível. Simule quanto cada procedimento pode render.
        </p>
        <Button asChild variant="secondary" className="relative mt-6">
          <Link to="/calculadora">Calcular potencial <ArrowRight /></Link>
        </Button>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bell } from "lucide-react";
import { ClientShell, Spinner } from "@/components/ClientShell";
import { EmptyState, EquipmentImage } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { brl, daysUntil, diariasUsadas, formatDate, hojeISO, useMe, type Equipamento } from "@/lib/data";
import { useMeusCustos, useMinhasLocacoes } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Início — Sinoslaser Área do Cliente" }] }),
  component: () => (
    <ClientShell>
      <Home />
    </ClientShell>
  ),
});

function Home() {
  const { data: me } = useMe();
  const id = me?.profile?.id;
  const { data: locacoes = [], isLoading, error } = useMinhasLocacoes(id);
  const { data: custos = [] } = useMeusCustos(id);

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="Não foi possível carregar" text="Tente novamente em instantes." />;

  const hoje = hojeISO();
  const ativa = locacoes.find((l) => l.status === "ativa") ?? locacoes.find((l) => l.status === "agendada");
  const equipMap = new Map<string, { eq: Equipamento; locado: boolean }>();
  for (const l of locacoes) {
    if (!l.equipamentos) continue;
    const locado = l.status === "ativa" && l.data_inicio <= hoje && l.data_fim >= hoje;
    const cur = equipMap.get(l.equipamento_id);
    if (!cur || locado) equipMap.set(l.equipamento_id, { eq: l.equipamentos, locado });
  }

  const mes = hoje.slice(0, 7);
  const d = new Date(hoje + "T00:00:00");
  d.setMonth(d.getMonth() - 1);
  const mesAnt = d.toISOString().slice(0, 7);
  const lucro = (m: string) =>
    custos.filter((c) => c.data.startsWith(m)).reduce((s, c) => s + Number(c.faturamento) - Number(c.anuncio) - Number(c.aluguel_equipamento) - Number(c.insumos), 0);
  const lMes = lucro(mes);
  const lAnt = lucro(mesAnt);
  const variacao = lAnt !== 0 ? ((lMes - lAnt) / Math.abs(lAnt)) * 100 : null;

  const usadas = ativa ? diariasUsadas(ativa) : 0;
  const diasFim = ativa ? daysUntil(ativa.data_fim) : null;
  const semCustoHoje = ativa?.status === "ativa" && !custos.some((c) => c.data === hoje);
  const firstName = (me?.profile?.nome ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow">Área do cliente</p>
        <h1 className="mt-1 text-4xl font-bold text-primary md:text-5xl">Olá{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mt-2 text-muted-foreground">Que bom ter você aqui.</p>
      </section>

      {(diasFim !== null && diasFim >= 0 && diasFim <= 3 && ativa?.status === "ativa") || semCustoHoje ? (
        <div className="space-y-2">
          {diasFim !== null && diasFim >= 0 && diasFim <= 3 && ativa?.status === "ativa" && (
            <Banner>Sua locação termina em {diasFim} dia{diasFim === 1 ? "" : "s"}.</Banner>
          )}
          {semCustoHoje && (
            <Banner>
              Você ainda não registrou os custos de hoje. <Link to="/calculadora" className="font-semibold underline">Registrar</Link>
            </Banner>
          )}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Diárias contratadas" value={ativa ? String(ativa.diarias_contratadas) : "—"} />
        <Card label="Usadas / restantes" value={ativa ? `${usadas} / ${ativa.diarias_contratadas - usadas}` : "—"} />
        <Card label="Término" value={ativa ? formatDate(ativa.data_fim) : "—"} />
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Lucro líquido do mês</p>
          <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${lMes >= 0 ? "text-success" : "text-destructive"}`}>{brl(lMes)}</p>
          {variacao !== null && (
            <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${variacao >= 0 ? "text-success" : "text-destructive"}`}>
              {variacao >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(variacao).toFixed(0)}% vs. mês anterior
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-primary">Meus equipamentos</h2>
        {equipMap.size === 0 ? (
          <EmptyState title="Nenhum equipamento ainda" text="Seus equipamentos aparecem aqui quando a locação for registrada." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...equipMap.values()].map(({ eq, locado }) => (
              <article key={eq.id} className="overflow-hidden rounded-3xl border bg-card shadow-card">
                <div className="relative aspect-[4/3]">
                  <EquipmentImage equipment={eq} />
                  <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${locado ? "bg-success text-primary-foreground" : "bg-card text-primary"}`}>
                    {locado ? "Locado agora" : "Disponível para consulta"}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-primary">{eq.nome}</h3>
                  <Button asChild className="mt-4 w-full">
                    <Link to="/equipamentos/$id" params={{ id: eq.id }}>Acessar equipamento <ArrowRight /></Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
      <Bell className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>{children}</p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-primary">{value}</p>
    </div>
  );
}

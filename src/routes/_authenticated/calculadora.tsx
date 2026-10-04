import { createFileRoute } from "@tanstack/react-router";
import { ClientShell } from "@/components/ClientShell";
import { PageHeader } from "@/components/brand";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { useMe } from "@/lib/data";
import { useMinhasLocacoes } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <Page />
    </ClientShell>
  ),
});

function Page() {
  const { data: me } = useMe();
  const { data: locs = [] } = useMinhasLocacoes(me?.profile?.id);
  const ativa = locs.find((l) => l.status === "ativa");
  return (
    <>
      <PageHeader eyebrow="Simulação" title="Calculadora" />
      <RevenueCalculator key={ativa?.id ?? "x"} aluguelPadrao={ativa?.valor_diaria} locacaoId={ativa?.id} />
    </>
  );
}

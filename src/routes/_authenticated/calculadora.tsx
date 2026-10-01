import { createFileRoute } from "@tanstack/react-router";
import { ClientShell } from "@/components/ClientShell";
import { PageHeader } from "@/components/brand";
import { RevenueCalculator } from "@/components/RevenueCalculator";

export const Route = createFileRoute("/_authenticated/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora — Sinoslaser" }] }),
  component: () => (
    <ClientShell>
      <PageHeader eyebrow="Simulação" title="Calculadora de faturamento" />
      <RevenueCalculator title="Simule seu potencial" />
    </ClientShell>
  ),
});

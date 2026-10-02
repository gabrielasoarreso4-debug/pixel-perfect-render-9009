import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl, hojeISO, useMe } from "@/lib/data";
import { cn } from "@/lib/utils";

type Props = { aluguelPadrao?: number | null; locacaoId?: string | null };

export function RevenueCalculator({ aluguelPadrao, locacaoId }: Props) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [v, setV] = useState({
    preco: "",
    procs: "",
    diarias: "1",
    anuncio: "",
    aluguel: aluguelPadrao ? String(aluguelPadrao) : "",
    insumos: "",
  });
  const [saving, setSaving] = useState(false);
  const n = (k: keyof typeof v) => Number(v[k].replace(",", ".")) || 0;

  const diarias = n("diarias");
  const fatDiaria = n("preco") * n("procs");
  const custoDiaria = n("anuncio") + n("aluguel") + n("insumos");
  const faturamento = fatDiaria * diarias;
  const custos = custoDiaria * diarias;
  const lucro = faturamento - custos;
  const lucroDiaria = fatDiaria - custoDiaria;
  const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;

  async function salvarDia() {
    if (!me?.profile) return;
    setSaving(true);
    const { error } = await supabase.from("custos_diarios").insert({
      cliente_id: me.profile.id,
      locacao_id: locacaoId ?? null,
      data: hojeISO(),
      anuncio: n("anuncio"),
      aluguel_equipamento: n("aluguel"),
      insumos: n("insumos"),
      faturamento: fatDiaria,
    });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar o dia.");
    toast.success("Dia salvo!");
    qc.invalidateQueries({ queryKey: ["custos"] });
  }

  const F = (k: keyof typeof v, label: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input inputMode="decimal" type="number" min={0} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className="h-12 rounded-xl text-base" placeholder="0" />
    </div>
  );

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-card md:p-7">
      <p className="eyebrow">Calculadora</p>
      <h2 className="mt-1 text-2xl font-bold text-primary">Lucro por diária</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {F("preco", "Preço médio do procedimento (R$)")}
        {F("procs", "Procedimentos por diária")}
        {F("diarias", "Diárias trabalhadas")}
      </div>
      <p className="mt-6 text-sm font-semibold text-primary">Custos por diária</p>
      <div className="mt-2 grid gap-4 sm:grid-cols-3">
        {F("anuncio", "Anúncio (R$)")}
        {F("aluguel", "Aluguel do equipamento (R$)")}
        {F("insumos", "Insumos (R$)")}
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-brand p-5 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.2em] opacity-80">Lucro líquido</p>
        <p className={cn("mt-1 inline-block rounded-xl bg-card px-3 font-display text-4xl font-bold tabular-nums", lucro >= 0 ? "text-success" : "text-destructive")}>
          {brl(lucro)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Faturamento" value={brl(faturamento)} />
          <Stat label="Custos totais" value={brl(custos)} />
          <Stat label="Lucro por diária" value={brl(lucroDiaria)} />
          <Stat label="Margem" value={`${margem.toFixed(1)}%`} />
        </div>
      </div>

      {me?.profile && !me.isAdmin && (
        <Button className="mt-5" onClick={salvarDia} disabled={saving || fatDiaria + custoDiaria === 0}>
          {saving ? "Salvando..." : "Salvar dia"}
        </Button>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Valores são <strong>estimativas</strong> com base nos números informados. "Salvar dia" registra os custos e o faturamento de uma diária de hoje.
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3">
      <p className="opacity-80">{label}</p>
      <p className="font-display text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl } from "@/lib/data";

type Props = {
  defaults?: { price?: number | null; perDay?: number | null; days?: number | null };
  title?: string;
};

export function RevenueCalculator({ defaults, title = "Potencial de faturamento" }: Props) {
  const [price, setPrice] = useState(String(defaults?.price ?? ""));
  const [perDay, setPerDay] = useState(String(defaults?.perDay ?? ""));
  const [days, setDays] = useState(String(defaults?.days ?? ""));
  const [target, setTarget] = useState("");

  const p = Number(price) || 0;
  const d = Number(perDay) || 0;
  const m = Number(days) || 0;
  const monthly = p * d * m;
  const weekly = m > 0 ? monthly / (m / Math.min(m, 7) > 0 ? m / Math.min(m, 7) : 1) : 0;
  const weeklyEst = p * d * Math.min(m, 7) > 0 ? (monthly * 12) / 52 : weekly;
  const t = Number(target) || 0;
  const needed = p > 0 && t > 0 ? Math.ceil(t / p) : null;

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-card md:p-7">
      <p className="eyebrow">Calculadora</p>
      <h2 className="mt-1 text-2xl font-bold text-primary">{title}</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Preço médio do procedimento (R$)" value={price} onChange={setPrice} />
        <Field label="Procedimentos por dia" value={perDay} onChange={setPerDay} />
        <Field label="Dias trabalhados por mês" value={days} onChange={setDays} />
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-brand p-5 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.2em] opacity-80">Faturamento bruto mensal estimado</p>
        <p className="mt-1 font-display text-4xl font-bold tabular-nums">{brl(monthly)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-primary-foreground/10 p-3">
            <p className="opacity-80">Semanal estimado</p>
            <p className="font-display text-lg font-semibold tabular-nums">{brl(weeklyEst)}</p>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-3">
            <p className="opacity-80">Procedimentos / mês</p>
            <p className="font-display text-lg font-semibold tabular-nums">{Math.round(d * m)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid items-end gap-4 sm:grid-cols-2">
        <Field label="Quero faturar por mês (R$)" value={target} onChange={setTarget} />
        <div className="rounded-2xl bg-primary-soft p-4 text-sm text-secondary-foreground">
          {needed !== null ? (
            <>
              Você precisaria de <strong className="font-display text-lg">{needed}</strong> procedimentos no mês
              {m > 0 && <> (cerca de {Math.ceil(needed / m)} por dia)</>}.
            </>
          ) : (
            "Informe o preço e a meta para ver quantos procedimentos são necessários."
          )}
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Os valores são apenas <strong>estimativas</strong> baseadas nos números informados por você. Não representam
        promessa ou garantia de faturamento.
      </p>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        inputMode="decimal"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl text-base"
        placeholder="0"
      />
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { Equipamento } from "@/lib/data";

export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("leading-none", className)}>
      <div
        className={cn(
          "font-brand text-2xl font-light tracking-[0.12em]",
          light ? "text-primary-foreground" : "text-primary",
        )}
      >
        SINOSLASER
      </div>
      <div
        className={cn(
          "mt-1 text-[9px] tracking-[0.08em]",
          light ? "text-primary-foreground/80" : "text-primary/80",
        )}
      >
        Locação de Equipamentos Estéticos e Médicos
      </div>
    </div>
  );
}

export function EquipmentImage({
  equipment,
  className,
}: {
  equipment: Pick<Equipamento, "nome" | "foto_url">;
  className?: string;
}) {
  if (equipment.foto_url) {
    return (
      <img
        src={equipment.foto_url}
        alt={equipment.nome}
        loading="lazy"
        className={cn("h-full w-full bg-surface object-contain", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-end overflow-hidden bg-gradient-brand p-5",
        className,
      )}
    >
      <div className="absolute -right-10 -top-10 size-48 rounded-full border border-primary-foreground/30" />
      <div className="absolute -right-2 top-16 size-32 rounded-full border border-primary-foreground/20" />
      <span className="relative font-display text-xl font-semibold text-primary-foreground">
        {equipment.nome}
      </span>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-bold text-primary md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
    </header>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-surface px-6 py-10 text-center">
      <p className="font-display font-semibold text-primary">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

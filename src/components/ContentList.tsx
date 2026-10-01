import { ExternalLink, FileText, PlayCircle, Megaphone, GraduationCap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EmptyState } from "@/components/brand";
import type { Content, SectionKey } from "@/lib/data";

const ICON: Record<string, typeof FileText> = {
  treinamento: GraduationCap,
  video: PlayCircle,
  protocolo: FileText,
  material: FileText,
  marketing: Megaphone,
};

type Item = Content & { equipments?: { name: string } | null };

export function ContentList({ items, section, showEquipment }: { items: Item[]; section?: SectionKey; showEquipment?: boolean }) {
  if (!items.length) {
    return <EmptyState title="Nenhum conteúdo por aqui ainda" text="Assim que a equipe Sinoslaser publicar, ele aparecerá aqui." />;
  }
  if (section === "faq") {
    return (
      <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
        {items.map((i) => (
          <AccordionItem key={i.id} value={i.id}>
            <AccordionTrigger className="text-left font-medium text-primary">{i.title}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-muted-foreground">{i.description}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((i) => {
        const Icon = ICON[i.section] ?? FileText;
        const Wrapper = i.url ? "a" : "div";
        return (
          <Wrapper
            key={i.id}
            {...(i.url ? { href: i.url, target: "_blank", rel: "noreferrer" } : {})}
            className="group flex gap-4 rounded-2xl border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
          >
            {i.thumbnail_url ? (
              <img src={i.thumbnail_url} alt="" className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                <Icon className="size-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5 text-[10px] font-medium uppercase tracking-wider text-lavender">
                {i.category && <span>{i.category}</span>}
                {showEquipment && i.equipments?.name && <span>· {i.equipments.name}</span>}
              </div>
              <p className="mt-0.5 font-display font-semibold text-primary">{i.title}</p>
              {i.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{i.description}</p>}
              {i.url && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Abrir {i.provider ? `no ${i.provider}` : ""} <ExternalLink className="size-3" />
                </span>
              )}
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}

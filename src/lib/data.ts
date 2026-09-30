import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Equipment = Database["public"]["Tables"]["equipments"]["Row"];
export type Content = Database["public"]["Tables"]["contents"]["Row"];
export type Rental = Database["public"]["Tables"]["rentals"]["Row"];
export type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type Settings = Database["public"]["Tables"]["app_settings"]["Row"];

export async function fetchMe() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const [roles, client, settings] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("clients").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const isAdmin = (roles.data ?? []).some((r) => r.role === "admin");
  return { user, isAdmin, client: client.data as Client | null, settings: settings.data as Settings | null };
}

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 30_000 });
}

export function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function accessInfo(c: Client | null | undefined) {
  if (!c) return { active: false, daysLeft: null as number | null, label: "Sem cadastro" };
  const daysLeft = daysUntil(c.access_expires_at);
  const active = !c.blocked && daysLeft !== null && daysLeft >= 0;
  const label = c.blocked ? "Bloqueada" : active ? "Ativa" : "Inativa";
  return { active, daysLeft, label };
}

export function whatsappUrl(number: string | null | undefined, text?: string) {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = d.length === 10 ? new Date(d + "T00:00:00") : new Date(d);
  return date.toLocaleDateString("pt-BR");
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const SECTIONS = {
  treinamento: { label: "Treinamento", categories: ["Curso completo", "Aula", "Treinamento"] },
  video: { label: "Vídeos", categories: ["Demonstração", "Vídeo técnico", "Aula"] },
  protocolo: { label: "Protocolos", categories: ["Protocolos"] },
  material: { label: "Materiais", categories: ["Manual", "Ficha", "Termos", "Materiais técnicos", "Outros"] },
  marketing: {
    label: "Marketing",
    categories: ["Fotos", "Vídeos", "Stories", "Posts", "Legendas", "Criativos", "Materiais promocionais"],
  },
  faq: { label: "Perguntas frequentes", categories: [] as string[] },
} as const;
export type SectionKey = keyof typeof SECTIONS;

export const TICKET_CATEGORIES = [
  "Dúvidas sobre equipamento",
  "Dúvidas sobre protocolos",
  "Problemas técnicos",
  "Dúvidas sobre o aplicativo",
];

export const TICKET_STATUS: Record<string, string> = {
  aberto: "Aberto",
  em_atendimento: "Em atendimento",
  resolvido: "Resolvido",
};

export function detectProvider(url: string) {
  if (/youtu\.?be/.test(url)) return "YouTube";
  if (/vimeo\.com/.test(url)) return "Vimeo";
  if (/drive\.google|docs\.google/.test(url)) return "Google Drive";
  return "Link externo";
}

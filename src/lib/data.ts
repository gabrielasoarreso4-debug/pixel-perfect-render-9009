import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Profile = T["profiles"]["Row"];
export type Equipamento = T["equipamentos"]["Row"];
export type Locacao = T["locacoes"]["Row"];
export type Custo = T["custos_diarios"]["Row"];
export type Faq = T["faq"]["Row"];
export type Chamado = T["chamados"]["Row"];

export const SUPORTE_WHATSAPP = "5551995582168";

export async function fetchMe() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const [roles, profile] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);
  const isAdmin = (roles.data ?? []).some((r) => r.role === "admin");
  return { user, isAdmin, profile: profile.data as Profile | null };
}

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 30_000 });
}

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysUntil(date: string | null | undefined) {
  if (!date) return null;
  const today = new Date(hojeISO() + "T00:00:00");
  const d = new Date(date + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function addDays(date: string, n: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function temAcesso(p: Profile | null | undefined) {
  if (!p) return false;
  const left = daysUntil(p.acesso_ate);
  return p.acesso_ativo && (left === null || left >= 0);
}

export function whatsappUrl(text?: string) {
  return `https://wa.me/${SUPORTE_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = d.length === 10 ? new Date(d + "T00:00:00") : new Date(d);
  return date.toLocaleDateString("pt-BR");
}

export const brl = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export const CHAMADO_CATEGORIAS = [
  "Dúvidas sobre equipamento",
  "Dúvidas sobre protocolos",
  "Problemas técnicos",
  "Dúvidas sobre o aplicativo",
];

export const CHAMADO_STATUS: Record<string, string> = {
  aberto: "Aberto",
  em_atendimento: "Em atendimento",
  resolvido: "Resolvido",
};

export const LOCACAO_STATUS: Record<string, string> = { agendada: "Agendada", ativa: "Ativa", encerrada: "Encerrada" };

/** Diárias usadas = dias decorridos dentro do período, limitado ao contratado. */
export function diariasUsadas(l: Locacao) {
  if (l.status === "agendada") return 0;
  const hoje = hojeISO();
  if (hoje < l.data_inicio) return 0;
  const fim = hoje > l.data_fim ? l.data_fim : hoje;
  const dias = Math.round((new Date(fim + "T00:00:00").getTime() - new Date(l.data_inicio + "T00:00:00").getTime()) / 86_400_000) + 1;
  return Math.min(l.diarias_contratadas, Math.max(0, dias));
}

export function embedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return null;
}

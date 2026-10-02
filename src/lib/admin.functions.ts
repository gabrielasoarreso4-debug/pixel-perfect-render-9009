import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const usuarioSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,30}$/, "Usuário: 3 a 30 letras minúsculas, números, ponto, hífen ou _");

export const emailDoUsuario = (u: string) => `${u.trim().toLowerCase()}@app.local`;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const existeAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { count } = await sb.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return { existe: (count ?? 0) > 0 };
});

const criarSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  usuario: usuarioSchema,
  senha: z.string().min(8, "Senha com 8+ caracteres").max(72),
});

async function criarUsuario(data: z.infer<typeof criarSchema>, role: "admin" | "cliente", extra?: { acesso_ate?: string | null }) {
  const sb = await admin();
  const { data: created, error } = await sb.auth.admin.createUser({
    email: emailDoUsuario(data.usuario),
    password: data.senha,
    email_confirm: true,
    user_metadata: { nome: data.nome, usuario: data.usuario },
  });
  if (error || !created.user) throw new Error(error?.message.includes("already") ? "Usuário já existe." : "Não foi possível criar o usuário.");
  const id = created.user.id;
  const { error: e1 } = await sb.from("profiles").insert({ id, nome: data.nome, usuario: data.usuario, acesso_ate: extra?.acesso_ate ?? null });
  const { error: e2 } = await sb.from("user_roles").insert({ user_id: id, role });
  if (e1 || e2) {
    await sb.auth.admin.deleteUser(id);
    throw new Error("Não foi possível salvar o perfil.");
  }
  return { id };
}

// Only works while no admin exists (first setup).
export const criarPrimeiroAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => criarSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { count } = await sb.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Já existe um administrador.");
    return criarUsuario(data, "admin");
  });

async function exigirAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Acesso negado.");
}

export const criarCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => criarSchema.extend({ acesso_ate: z.string().nullable().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    return criarUsuario(data, "cliente", { acesso_ate: data.acesso_ate ?? null });
  });

export const alterarSenhaCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), senha: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const sb = await admin();
    const { error } = await sb.auth.admin.updateUserById(data.id, { password: data.senha });
    if (error) throw new Error("Não foi possível alterar a senha.");
    return { ok: true };
  });

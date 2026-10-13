import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const normalizarUsuario = (u: string) => u.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const usuarioSchema = z
  .string()
  .trim()
  .transform(normalizarUsuario)
  .regex(/^[a-z0-9._-]{3,30}$/, "Usuário inválido. Use de 3 a 30 letras, números, ponto, hífen ou _.");

export const emailDoUsuario = (u: string) => `${normalizarUsuario(u)}@app.local`;

function erroCadastro(error: unknown, etapa: string): Error {
  console.error(`[cadastro-cliente] Falha na etapa ${etapa}:`, error);
  const err = error as { code?: string; message?: string; details?: string; hint?: string };
  const code = err?.code ?? "";
  const message = [err?.message, err?.details, err?.hint].filter(Boolean).join(" — ");
  const lower = message.toLowerCase();

  if (code === "23505" && lower.includes("user_roles_single_admin")) {
    return new Error("Já existe um administrador. A conta nova não foi criada.");
  }
  if (code === "23505" || /already (registered|exists)|duplicate key|email_exists/.test(lower)) {
    return new Error("Este usuário já está cadastrado.");
  }
  if (/invalid email|email address is invalid/.test(lower)) {
    return new Error("O usuário informado não gerou um e-mail de login válido. Use letras, números, ponto, hífen ou _.");
  }
  if (code === "23502") {
    const coluna = message.match(/column ["']?([^"' ]+)["']?/)?.[1];
    return new Error(coluna ? `Campo obrigatório ausente: ${coluna}.` : "Há um campo obrigatório ausente no cadastro.");
  }
  if (code === "23503") return new Error("Não foi possível vincular a conta ao perfil. Confira o usuário e tente novamente.");
  if (code === "42501" || /row-level security|permission denied|not allowed/.test(lower)) {
    return new Error("O servidor não tem permissão para salvar o cliente. Confira a chave administrativa e as políticas do banco.");
  }
  if (code === "42P01" || /relation .* does not exist|table .* not found/.test(lower)) {
    return new Error("Uma tabela necessária não existe no banco. Aplique as migrations do projeto.");
  }
  return new Error(message ? `Falha ao ${etapa}: ${message}` : `Não foi possível ${etapa}.`);
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const existeAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { count, error } = await sb.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  if (error) throw erroCadastro(error, "verificar administrador");
  const { isBootstrapSecretConfigured } = await import("@/lib/admin-bootstrap-secret.server");
  return { existe: (count ?? 0) > 0, bootstrapEnabled: isBootstrapSecretConfigured(process.env.ADMIN_BOOTSTRAP_SECRET) };
});

const criarSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo.").max(120, "O nome deve ter até 120 caracteres."),
  usuario: usuarioSchema,
  senha: z.string().min(12, "A senha precisa ter pelo menos 12 caracteres.").max(72, "A senha deve ter até 72 caracteres."),
});

async function criarUsuario(data: z.infer<typeof criarSchema>, role: "admin" | "cliente", extra?: { acesso_ate?: string | null }) {
  const sb = await admin();
  const { data: existingProfile, error: lookupError } = await sb
    .from("profiles")
    .select("id")
    .eq("usuario", data.usuario)
    .maybeSingle();
  if (lookupError) throw erroCadastro(lookupError, "verificar usuário");
  if (existingProfile) throw new Error("Este usuário já está cadastrado.");

  const { data: created, error: authError } = await sb.auth.admin.createUser({
    email: emailDoUsuario(data.usuario),
    password: data.senha,
    email_confirm: true,
    user_metadata: { nome: data.nome, usuario: data.usuario },
  });
  if (authError) throw erroCadastro(authError, "criar login");
  if (!created.user) throw new Error("O Supabase não retornou a conta criada.");

  const id = created.user.id;
  const { error: profileError } = await sb.from("profiles").insert({
    id,
    nome: data.nome,
    usuario: data.usuario,
    acesso_ate: extra?.acesso_ate ?? null,
  });
  if (profileError) {
    const { error: rollbackError } = await sb.auth.admin.deleteUser(id);
    if (rollbackError) console.error("[cadastro-cliente] Falha ao desfazer login após erro no perfil:", rollbackError);
    throw erroCadastro(profileError, "salvar perfil");
  }

  const { error: roleError } = await sb.from("user_roles").insert({ user_id: id, role });
  if (roleError) {
    const { error: rollbackError } = await sb.auth.admin.deleteUser(id);
    if (rollbackError) console.error("[cadastro-cliente] Falha ao desfazer conta após erro no papel:", rollbackError);
    throw erroCadastro(roleError, "atribuir papel");
  }

  return { id };
}

// Only works while no admin exists (first setup).
export const criarPrimeiroAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => criarSchema.extend({
    bootstrapSecret: z.string().min(32).max(256),
    nome: z.string().trim().min(2, "Informe o nome completo.").max(120, "O nome deve ter até 120 caracteres."),
    senha: z.string().min(12, "Senha com 12+ caracteres").max(72, "A senha deve ter até 72 caracteres."),
  }).parse(d))
  .handler(async ({ data }) => {
    const { isBootstrapSecretValid } = await import("@/lib/admin-bootstrap-secret.server");
    if (!isBootstrapSecretValid(process.env.ADMIN_BOOTSTRAP_SECRET, data.bootstrapSecret)) {
      throw new Error("Código de configuração inicial inválido ou desabilitado.");
    }
    const adminData = { nome: data.nome, usuario: data.usuario, senha: data.senha };
    const sb = await admin();
    const { count, error } = await sb.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if (error) throw erroCadastro(error, "verificar administrador");
    if ((count ?? 0) > 0) throw new Error("Já existe um administrador.");
    return criarUsuario(adminData, "admin");
  });

async function exigirAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw erroCadastro(error, "validar permissão administrativa");
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
  .inputValidator((d) => z.object({ id: z.string().uuid(), senha: z.string().min(12).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const sb = await admin();
    const { error } = await sb.auth.admin.updateUserById(data.id, { password: data.senha });
    if (error) throw new Error("Não foi possível alterar a senha.");
    return { ok: true };
  });

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Sinoslaser Área do Cliente" },
      { name: "description", content: "Defina uma nova senha para sua conta Sinoslaser." },
      { property: "og:title", content: "Nova senha — Sinoslaser" },
      { property: "og:description", content: "Defina uma nova senha para sua conta Sinoslaser." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return void toast.error("A senha precisa ter pelo menos 8 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return void toast.error("Link expirado ou inválido. Solicite um novo.");
    toast.success("Senha alterada!");
    navigate({ to: "/inicio" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Wordmark className="mb-10" />
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-3xl font-bold text-primary">Defina sua nova senha</h1>
        <Input type="password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-full px-5" />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>Salvar nova senha</Button>
      </form>
    </div>
  );
}

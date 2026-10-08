import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Home, Sparkles, Calculator, LifeBuoy, User, ShieldCheck, LogOut, MessageCircle, Clock, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { temAcesso, useMe, whatsappUrl } from "@/lib/data";

const NAV = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/equipamentos", label: "Equipamentos", icon: Sparkles },
  { to: "/conteudos", label: "Conteúdos", icon: GraduationCap },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/suporte", label: "Suporte", icon: LifeBuoy },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export function Spinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function ClientShell({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useMe();
  const signOut = useSignOut();

  if (isLoading || !me) return <Spinner />;

  const bloqueado = !me.isAdmin && !temAcesso(me.profile);
  const wa = whatsappUrl("Olá! Sou cliente Sinoslaser e preciso de ajuda.");

  return (
    <div className="min-h-screen bg-gradient-soft md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar px-6 py-8 md:flex">
        <Wordmark />
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-primary !text-primary-foreground hover:!bg-primary" }}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
          {me.isAdmin && (
            <Link to="/admin" className="mt-4 flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary-soft">
              <ShieldCheck className="size-4" /> Painel admin
            </Link>
          )}
        </nav>
        <div className="mt-auto space-y-2">
          <Button asChild variant="whatsapp" className="w-full">
            <a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}><LogOut /> Sair</Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between px-5 pb-2 pt-5 md:hidden">
          <Wordmark className="origin-left scale-90" />
          {me.isAdmin && <Link to="/admin" className="rounded-full border px-3 py-1.5 text-xs font-medium text-primary">Admin</Link>}
        </header>
        <main className="mx-auto max-w-5xl px-5 pb-32 pt-4 md:px-10 md:pb-16 md:pt-10">
          {bloqueado ? (
            <div className="mx-auto max-w-lg py-10 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-soft"><Clock className="size-7 text-primary" /></div>
              <h1 className="mt-6 text-3xl font-bold text-primary">Acesso indisponível</h1>
              <p className="mt-3 text-muted-foreground">Fale com o suporte para reativar seu acesso.</p>
              <div className="mt-8 flex flex-col gap-3">
                <Button asChild variant="whatsapp" size="lg"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> Falar com o suporte</a></Button>
                <Button variant="ghost" onClick={signOut}>Sair</Button>
              </div>
            </div>
          ) : children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground" activeProps={{ className: "!text-primary" }}>
              <n.icon className="size-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

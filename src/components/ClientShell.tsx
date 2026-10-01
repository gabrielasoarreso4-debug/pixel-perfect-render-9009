import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Home, Sparkles, PlayCircle, LifeBuoy, User, ShieldCheck, LogOut, MessageCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { accessInfo, useMe, whatsappUrl } from "@/lib/data";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/equipamentos", label: "Equipamentos", icon: Sparkles },
  { to: "/conteudos", label: "Conteúdos", icon: PlayCircle },
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

export function ClientShell({ children, allowInactive }: { children: ReactNode; allowInactive?: boolean }) {
  const { data: me, isLoading } = useMe();
  const signOut = useSignOut();

  if (isLoading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const info = accessInfo(me.client);
  const blockedView = !me.isAdmin && !info.active && !allowInactive;
  const wa = whatsappUrl(me.settings?.support_whatsapp, "Olá! Sou cliente Sinoslaser e preciso de ajuda.");

  return (
    <div className="min-h-screen bg-gradient-soft md:flex">
      {/* Desktop sidebar */}
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
            <Link
              to="/admin"
              className="mt-4 flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary-soft"
            >
              <ShieldCheck className="size-4" /> Painel admin
            </Link>
          )}
        </nav>
        <div className="mt-auto space-y-2">
          {wa && (
            <Button asChild variant="whatsapp" className="w-full">
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
            <LogOut /> Sair
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-5 pb-2 pt-5 md:hidden">
          <Wordmark className="scale-90 origin-left" />
          {me.isAdmin && (
            <Link to="/admin" className="rounded-full border px-3 py-1.5 text-xs font-medium text-primary">
              Admin
            </Link>
          )}
        </header>

        <main className="mx-auto max-w-5xl px-5 pb-32 pt-4 md:px-10 md:pb-16 md:pt-10">
          {blockedView ? <PausedScreen wa={wa} onSignOut={signOut} /> : (
            <>
              {!me.isAdmin && info.daysLeft !== null && info.daysLeft >= 0 && info.daysLeft <= 15 && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
                  <Clock className="mt-0.5 size-4 shrink-0 text-warning" />
                  <p>
                    <strong>
                      {info.daysLeft === 0 ? "Seu acesso expira hoje." : `Faltam ${info.daysLeft} dia${info.daysLeft > 1 ? "s" : ""}.`}
                    </strong>{" "}
                    Seu acesso está próximo de expirar. Realize uma nova locação para continuar aproveitando seus
                    conteúdos exclusivos.
                  </p>
                </div>
              )}
              {children}
            </>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground"
              activeProps={{ className: "!text-primary" }}
            >
              <n.icon className="size-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function PausedScreen({ wa, onSignOut }: { wa: string | null; onSignOut: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-soft">
        <Clock className="size-7 text-primary" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-primary">Seu acesso está pausado</h1>
      <p className="mt-3 text-muted-foreground">
        O acesso aos conteúdos fica disponível enquanto você tem uma locação ativa com a Sinoslaser. Seus dados
        continuam guardados — assim que uma nova locação for registrada, tudo é liberado novamente.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        {wa && (
          <Button asChild variant="whatsapp" size="lg">
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle /> Falar com o suporte
            </a>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/perfil">Meu perfil</Link>
        </Button>
        <Button variant="ghost" onClick={onSignOut}>Sair</Button>
      </div>
    </div>
  );
}

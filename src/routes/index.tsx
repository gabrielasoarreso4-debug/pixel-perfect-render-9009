import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { GraduationCap, FileText, Megaphone, Calculator, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sinoslaser Área do Cliente" },
      { name: "description", content: "Treinamentos, protocolos, marketing e suporte para clientes que locam equipamentos Sinoslaser." },
      { property: "og:title", content: "Sinoslaser Área do Cliente" },
      { property: "og:description", content: "Área exclusiva para clientes Sinoslaser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: GraduationCap, label: "Cursos e treinamentos" },
  { icon: FileText, label: "Protocolos e documentos" },
  { icon: Megaphone, label: "Materiais de marketing" },
  { icon: Calculator, label: "Potencial de faturamento" },
  { icon: LifeBuoy, label: "Suporte dedicado" },
];

function Index() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-card px-5 py-4 shadow-card md:px-12">
        <Wordmark />
        <Button asChild variant="outline" size="sm">
          <Link to={signedIn ? "/home" : "/auth"}>{signedIn ? "Minha área" : "Entrar"}</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_1fr] md:px-12 md:py-24">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">#Área exclusiva</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] text-primary md:text-6xl">
            Tudo para potencializar seus resultados
          </h1>
          <p className="mt-5 max-w-md text-lg text-primary/80">
            Treinamentos, protocolos, materiais de divulgação e suporte dos equipamentos que você loca com a
            Sinoslaser — em um só lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={signedIn ? "/home" : "/auth"}>{signedIn ? "Acessar minha área" : "Entrar na minha conta"}</Link>
            </Button>
            {!signedIn && (
              <Button asChild size="lg" variant="outline">
                <Link to="/auth" search={{ mode: "signup" }}>Criar conta</Link>
              </Button>
            )}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-brand p-8 text-primary-foreground shadow-float md:p-10">
          <div className="absolute -left-16 -top-16 size-72 rounded-full border border-primary-foreground/30" />
          <div className="absolute -bottom-24 -right-10 size-80 rounded-full border border-primary-foreground/20" />
          <p className="relative text-sm uppercase tracking-[0.2em] opacity-80">Para clientes Sinoslaser</p>
          <ul className="relative mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 rounded-2xl bg-primary-foreground/10 px-4 py-3">
                <f.icon className="size-5" />
                <span className="font-medium">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

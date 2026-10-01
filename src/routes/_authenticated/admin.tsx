import { createFileRoute, Link } from "@tanstack/react-router";
import { useMe } from "@/lib/data";
import { PageHeader } from "@/components/brand";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel admin — Sinoslaser" }] }),
  component: Admin,
});

function Admin() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return null;
  if (!me?.isAdmin) return <div className="p-10 text-center">Acesso restrito.</div>;
  return (
    <div className="mx-auto max-w-3xl p-8">
      <PageHeader eyebrow="Administração" title="Painel administrativo" subtitle="As telas de gestão (clientes, locações, equipamentos, conteúdos e chamados) ainda serão construídas." />
      <Link to="/inicio" className="text-primary underline">Voltar à área do cliente</Link>
    </div>
  );
}

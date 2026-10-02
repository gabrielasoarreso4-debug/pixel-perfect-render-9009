DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.equipment_views, public.notifications, public.support_tickets, public.contents, public.client_equipments, public.rentals, public.equipments, public.clients CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user(), public.on_rental_change(), public.recompute_client_access(uuid), public.can_access_equipment(uuid), public.client_is_active(uuid), public.my_client_id(), public.update_my_profile(text,text) CASCADE;
DELETE FROM public.user_roles;
ALTER TYPE public.app_role RENAME VALUE 'client' TO 'cliente';

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  usuario text NOT NULL UNIQUE,
  acesso_ativo boolean NOT NULL DEFAULT true,
  acesso_ate date,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.tem_acesso()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
    AND p.acesso_ativo AND (p.acesso_ate IS NULL OR p.acesso_ate >= current_date))
$$;

CREATE TABLE public.equipamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  foto_url text,
  link_treinamento text,
  link_marketing text,
  protocolo_pdf_path text,
  ativo boolean NOT NULL DEFAULT true,
  valor_diaria_padrao numeric,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos TO authenticated;
GRANT ALL ON public.equipamentos TO service_role;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.locacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipamento_id uuid NOT NULL REFERENCES public.equipamentos(id) ON DELETE RESTRICT,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  diarias_contratadas int NOT NULL CHECK (diarias_contratadas > 0),
  horas_por_diaria int NOT NULL DEFAULT 10 CHECK (horas_por_diaria IN (10,12)),
  valor_diaria numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','ativa','encerrada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locacoes TO authenticated;
GRANT ALL ON public.locacoes TO service_role;
ALTER TABLE public.locacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read" ON public.locacoes FOR SELECT TO authenticated USING ((cliente_id = auth.uid() AND public.tem_acesso()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write" ON public.locacoes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.tem_equipamento(_eq uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin') OR (public.tem_acesso() AND EXISTS (
    SELECT 1 FROM public.locacoes l WHERE l.equipamento_id = _eq AND l.cliente_id = auth.uid()))
$$;

CREATE POLICY "linked or admin read" ON public.equipamentos FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR (ativo AND public.tem_equipamento(id)));
CREATE POLICY "admin write" ON public.equipamentos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.custos_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  locacao_id uuid REFERENCES public.locacoes(id) ON DELETE SET NULL,
  data date NOT NULL DEFAULT current_date,
  anuncio numeric NOT NULL DEFAULT 0,
  aluguel_equipamento numeric NOT NULL DEFAULT 0,
  insumos numeric NOT NULL DEFAULT 0,
  faturamento numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custos_diarios TO authenticated;
GRANT ALL ON public.custos_diarios TO service_role;
ALTER TABLE public.custos_diarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read" ON public.custos_diarios FOR SELECT TO authenticated USING (cliente_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own insert" ON public.custos_diarios FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid() AND public.tem_acesso());
CREATE POLICY "own update" ON public.custos_diarios FOR UPDATE TO authenticated USING (cliente_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (cliente_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete" ON public.custos_diarios FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  pergunta text NOT NULL,
  resposta text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq TO authenticated;
GRANT ALL ON public.faq TO service_role;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read faq" ON public.faq FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR (public.tem_acesso() AND (equipamento_id IS NULL OR public.tem_equipamento(equipamento_id))));
CREATE POLICY "admin write" ON public.faq FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE SET NULL,
  assunto text NOT NULL CHECK (length(assunto) BETWEEN 1 AND 150),
  categoria text NOT NULL,
  mensagem text NOT NULL CHECK (length(mensagem) BETWEEN 1 AND 3000),
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_atendimento','resolvido')),
  resposta text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados TO authenticated;
GRANT ALL ON public.chamados TO service_role;
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read" ON public.chamados FOR SELECT TO authenticated USING (cliente_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own insert" ON public.chamados FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid() AND status = 'aberto' AND resposta IS NULL AND public.tem_acesso());
CREATE POLICY "admin update" ON public.chamados FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete" ON public.chamados FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

REVOKE EXECUTE ON FUNCTION public.tem_acesso(), public.tem_equipamento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tem_acesso(), public.tem_equipamento(uuid) TO authenticated;

INSERT INTO public.equipamentos (nome, slug, ordem, ativo) VALUES
('Ultraformer MPT','ultraformer-mpt',1,true),
('Delight 1470','delight-1470',2,true),
('Lavieen Thulium','lavieen-thulium',3,true),
('Etherea MX','etherea-mx',4,true),
('Light Sheer','light-sheer',5,true),
('Soprano','soprano',6,true),
('Ultraformer III','ultraformer-iii',7,true),
('Hegon CO2','hegon-co2',8,true),
('Ptolomeu','ptolomeu',9,true),
('Elyon','elyon',10,true),
('Inkie','inkie',11,true),
('Laser Mini Premium','laser-mini-premium',12,true),
('Laser Mini 4D','laser-mini-4d',13,true),
('Criofrequência','criofrequencia',14,true),
('Harmony XL','harmony-xl',15,false);

CREATE POLICY "admin upload protocolos" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'protocolos' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'protocolos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "cliente le protocolos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'protocolos' AND EXISTS (SELECT 1 FROM public.equipamentos e WHERE e.protocolo_pdf_path = storage.objects.name AND public.tem_equipamento(e.id)));
CREATE POLICY "admin fotos" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'fotos' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'fotos' AND public.has_role(auth.uid(),'admin'));
CREATE TABLE public.materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secao text NOT NULL CHECK (secao IN ('treinamento','protocolo','marketing')),
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  categoria text,
  tipo text NOT NULL CHECK (tipo IN ('video','pdf','imagem','arquivo','link')),
  arquivo_path text,
  link_url text,
  duracao text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;
GRANT ALL ON public.materiais TO service_role;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin write materiais" ON public.materiais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "read materiais" ON public.materiais FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.tem_acesso() AND (equipamento_id IS NULL OR public.tem_equipamento(equipamento_id))));

CREATE TABLE public.materiais_progresso (
  cliente_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  concluido_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cliente_id, material_id)
);
GRANT SELECT, INSERT, DELETE ON public.materiais_progresso TO authenticated;
GRANT ALL ON public.materiais_progresso TO service_role;
ALTER TABLE public.materiais_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progresso read" ON public.materiais_progresso FOR SELECT TO authenticated USING (cliente_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own progresso insert" ON public.materiais_progresso FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "own progresso delete" ON public.materiais_progresso FOR DELETE TO authenticated USING (cliente_id = auth.uid());

CREATE POLICY "admin manage materiais files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'materiais' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'materiais' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "clients read materiais files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'materiais' AND EXISTS (SELECT 1 FROM public.materiais m WHERE m.arquivo_path = storage.objects.name));
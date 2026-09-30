CREATE TYPE public.app_role AS ENUM ('admin','client');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- settings (single row)
CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_days int NOT NULL DEFAULT 60,
  support_whatsapp text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin update settings" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.app_settings (id) VALUES (1);

-- clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL UNIQUE,
  whatsapp text,
  blocked boolean NOT NULL DEFAULT false,
  last_rental_date date,
  access_start_date date,
  access_expires_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own client or admin read" ON public.clients FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write clients" ON public.clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.my_client_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.clients WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.client_is_active(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = _client_id AND NOT c.blocked
    AND c.access_expires_at IS NOT NULL AND c.access_expires_at >= current_date)
$$;

CREATE OR REPLACE FUNCTION public.update_my_profile(_full_name text, _whatsapp text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(trim(_full_name)) = 0 OR length(_full_name) > 120 OR length(coalesce(_whatsapp,'')) > 30 THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;
  UPDATE public.clients SET full_name = trim(_full_name), whatsapp = nullif(trim(_whatsapp),''), updated_at = now()
  WHERE user_id = auth.uid();
END $$;

-- equipments
CREATE TABLE public.equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  default_procedure_price numeric,
  default_procedures_per_day numeric,
  default_days_per_month numeric,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipments TO authenticated;
GRANT ALL ON public.equipments TO service_role;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.client_equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, equipment_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_equipments TO authenticated;
GRANT ALL ON public.client_equipments TO service_role;
ALTER TABLE public.client_equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read ce" ON public.client_equipments FOR SELECT TO authenticated
  USING (client_id = public.my_client_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write ce" ON public.client_equipments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.can_access_equipment(_equipment_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.client_equipments ce
    JOIN public.clients c ON c.id = ce.client_id
    JOIN public.equipments e ON e.id = ce.equipment_id
    WHERE ce.equipment_id = _equipment_id AND c.user_id = auth.uid() AND e.active
      AND NOT c.blocked AND c.access_expires_at >= current_date)
$$;

CREATE POLICY "released equipments" ON public.equipments FOR SELECT TO authenticated
  USING (public.can_access_equipment(id));
CREATE POLICY "admin write equipments" ON public.equipments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- rentals
CREATE TABLE public.rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','encerrada','cancelada')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rentals TO authenticated;
GRANT ALL ON public.rentals TO service_role;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read rentals" ON public.rentals FOR SELECT TO authenticated
  USING (client_id = public.my_client_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write rentals" ON public.rentals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.recompute_client_access(_client_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _days int; _last date; _first date;
BEGIN
  SELECT access_days INTO _days FROM public.app_settings WHERE id = 1;
  SELECT max(greatest(start_date, coalesce(end_date, start_date))), min(start_date)
    INTO _last, _first
    FROM public.rentals WHERE client_id = _client_id AND status <> 'cancelada';
  UPDATE public.clients SET
    last_rental_date = _last,
    access_start_date = coalesce(access_start_date, _first),
    access_expires_at = CASE WHEN _last IS NULL THEN NULL ELSE _last + coalesce(_days,60) END,
    updated_at = now()
  WHERE id = _client_id;
END $$;

CREATE OR REPLACE FUNCTION public.on_rental_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.status <> 'cancelada' THEN
    INSERT INTO public.client_equipments (client_id, equipment_id) VALUES (NEW.client_id, NEW.equipment_id)
    ON CONFLICT DO NOTHING;
    IF TG_OP = 'INSERT' THEN
      UPDATE public.clients SET blocked = false WHERE id = NEW.client_id;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_client_access(OLD.client_id);
    RETURN OLD;
  END IF;
  PERFORM public.recompute_client_access(NEW.client_id);
  RETURN NEW;
END $$;
CREATE TRIGGER rentals_after_change AFTER INSERT OR UPDATE OR DELETE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.on_rental_change();

-- contents (courses, videos, protocols, documents, marketing, faq)
CREATE TABLE public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('treinamento','video','protocolo','material','marketing','faq')),
  category text,
  title text NOT NULL,
  description text,
  url text,
  thumbnail_url text,
  provider text,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contents TO authenticated;
GRANT ALL ON public.contents TO service_role;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "released contents" ON public.contents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (published AND equipment_id IS NOT NULL AND public.can_access_equipment(equipment_id)));
CREATE POLICY "admin write contents" ON public.contents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE SET NULL,
  subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 150),
  category text NOT NULL,
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 3000),
  attachment_url text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_atendimento','resolvido')),
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (client_id = public.my_client_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "client create ticket" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (client_id = public.my_client_id() AND status = 'aberto' AND admin_response IS NULL);
CREATE POLICY "admin update tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete tickets" ON public.support_tickets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- notifications (prepared for future channels)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  kind text NOT NULL,
  channel text NOT NULL DEFAULT 'app',
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read notif" ON public.notifications FOR SELECT TO authenticated
  USING (client_id = public.my_client_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write notif" ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- equipment views (for "mais acessados")
CREATE TABLE public.equipment_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.equipment_views TO authenticated;
GRANT ALL ON public.equipment_views TO service_role;
ALTER TABLE public.equipment_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read views" ON public.equipment_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "client log view" ON public.equipment_views FOR INSERT TO authenticated
  WITH CHECK (client_id = public.my_client_id() AND public.can_access_equipment(equipment_id));

-- new user: link or create client, assign role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  END IF;
  UPDATE public.clients SET user_id = NEW.id,
    full_name = CASE WHEN full_name = '' THEN coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '') ELSE full_name END,
    whatsapp = coalesce(whatsapp, NEW.raw_user_meta_data->>'whatsapp')
  WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
  IF NOT FOUND THEN
    INSERT INTO public.clients (user_id, email, full_name, whatsapp)
    VALUES (NEW.id, lower(NEW.email),
      coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      NEW.raw_user_meta_data->>'whatsapp')
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t1 BEFORE UPDATE ON public.equipments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t2 BEFORE UPDATE ON public.contents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t3 BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.equipments (name, slug, sort_order) VALUES
('Ultraformer MPT','ultraformer-mpt',1),
('Delight Endolaser','delight-endolaser',2),
('Lavieen Thulium','lavieen-thulium',3),
('Etherea MX','etherea-mx',4),
('Light Sheer ET 400','light-sheer-et-400',5),
('Soprano XL','soprano-xl',6),
('Mini Premium','mini-premium',7),
('Mini 4D','mini-4d',8),
('Criofrequência','criofrequencia',9),
('Ultraformer III','ultraformer-iii',10),
('Harmony XL','harmony-xl',11),
('Inkie','inkie',12),
('Elyon Endolaser','elyon-endolaser',13),
('Ptolomeu','ptolomeu',14);
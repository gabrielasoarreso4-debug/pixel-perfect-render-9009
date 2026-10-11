-- Keep a single administrator account. Prefer the configured owner handle when it already exists.
DO $$
DECLARE
  keep_admin_id uuid;
BEGIN
  SELECT ur.user_id
    INTO keep_admin_id
    FROM public.user_roles AS ur
    LEFT JOIN public.profiles AS p ON p.id = ur.user_id
   WHERE ur.role = 'admin'
   ORDER BY CASE WHEN lower(coalesce(p.usuario, '')) = 'caua' THEN 0 ELSE 1 END,
            p.created_at ASC NULLS LAST,
            ur.user_id ASC
   LIMIT 1;

  IF keep_admin_id IS NOT NULL THEN
    DELETE FROM public.user_roles
     WHERE role = 'admin'
       AND user_id <> keep_admin_id;
  END IF;
END
$$;

-- Also prevents concurrent first-admin setup requests from creating multiple admins.
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_admin
  ON public.user_roles (role)
  WHERE role = 'admin';

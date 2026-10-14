-- Enable RLS on the known application tables, then on all application tables
-- currently present in public. auth.users remains in Supabase's protected auth schema.
ALTER TABLE IF EXISTS public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_civio_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, auth
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users AS current_user_record
    WHERE current_user_record.id = auth.uid()
      AND lower(current_user_record.email) = 'iamasanteprince@gmail.com'
      AND current_user_record.email_confirmed_at IS NOT NULL
  );
$function$;

REVOKE ALL ON FUNCTION public.is_civio_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_civio_admin() TO authenticated;

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT c.relname
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.relname);
  END LOOP;
END
$$;

DO $$
DECLARE
  target_table TEXT;
  owner_column TEXT;
  policy_name TEXT;
  existing_policy RECORD;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['initiatives', 'comments', 'votes']
  LOOP
    IF to_regclass(format('public.%I', target_table)) IS NULL THEN
      CONTINUE;
    END IF;

    FOR existing_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', existing_policy.policyname, target_table);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      target_table || ' public read',
      target_table
    );

    SELECT column_name
      INTO owner_column
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND information_schema.columns.table_name = target_table
      AND column_name IN ('user_id', 'owner_id', 'author_id')
      AND data_type = 'uuid'
    ORDER BY CASE column_name WHEN 'user_id' THEN 1 WHEN 'owner_id' THEN 2 ELSE 3 END
    LIMIT 1;

    IF owner_column IS NOT NULL THEN
      policy_name := target_table || ' owner access';
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() = %I OR public.is_civio_admin()) WITH CHECK (auth.uid() = %I OR public.is_civio_admin())',
        policy_name,
        target_table,
        owner_column,
        owner_column
      );
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN;
  END IF;

  FOR existing_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', existing_policy.policyname);
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
      AND data_type = 'uuid'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can only modify their own profile" ON public.profiles
      FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_civio_admin())
      WITH CHECK (auth.uid() = user_id OR public.is_civio_admin())';
  END IF;

  REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.public_profiles WITH (security_barrier = true) AS
      SELECT user_id AS id, display_name, avatar_url FROM public.profiles';
    GRANT SELECT ON public.public_profiles TO anon, authenticated;
  END IF;
END
$$;

REVOKE ALL ON TABLE auth.users FROM anon, authenticated;

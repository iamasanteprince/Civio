DO $$
DECLARE
  table_record RECORD;
  user_id_attribute SMALLINT;
  auth_user_foreign_key_exists BOOLEAN;
  constraint_name TEXT;
BEGIN
  FOR table_record IN
    SELECT tables.table_name
    FROM information_schema.tables AS tables
    JOIN information_schema.columns AS columns
      ON columns.table_schema = tables.table_schema
      AND columns.table_name = tables.table_name
      AND columns.column_name = 'user_id'
      AND columns.data_type = 'uuid'
    WHERE tables.table_schema = 'public'
      AND tables.table_type = 'BASE TABLE'
  LOOP
    SELECT attnum
      INTO user_id_attribute
    FROM pg_attribute
    WHERE attrelid = to_regclass(format('public.%I', table_record.table_name))
      AND attname = 'user_id'
      AND NOT attisdropped;

    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint AS foreign_key
      WHERE foreign_key.contype = 'f'
        AND foreign_key.conrelid = to_regclass(format('public.%I', table_record.table_name))
        AND foreign_key.confrelid = 'auth.users'::regclass
        AND user_id_attribute = ANY(foreign_key.conkey)
    ) INTO auth_user_foreign_key_exists;

    IF NOT auth_user_foreign_key_exists THEN
      constraint_name := left(table_record.table_name, 45) || '_user_auth_cascade_fk';
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID',
        table_record.table_name,
        constraint_name
      );
    END IF;
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, auth
AS $function$
DECLARE
  caller_id uuid := auth.uid();
  deleted_count integer;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.users WHERE id = caller_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 1 THEN
    RAISE EXCEPTION 'Account deletion did not complete'
      USING ERRCODE = 'P0001';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

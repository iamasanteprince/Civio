CREATE OR REPLACE FUNCTION public.admin_activity_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, auth, public
AS $function$
DECLARE
  member_total bigint;
  signup_rows jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM auth.users AS current_user_record
    WHERE current_user_record.id = auth.uid()
      AND lower(current_user_record.email) = 'iamasanteprince@gmail.com'
      AND current_user_record.email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Administrator access required'
      USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO member_total
  FROM auth.users;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'email', signup.email,
        'display_name', signup.raw_user_meta_data ->> 'display_name',
        'created_at', signup.created_at,
        'age_consent_given', signup.raw_user_meta_data -> 'age_consent_given',
        'age_consent_timestamp', signup.raw_user_meta_data ->> 'age_consent_timestamp'
      )
      ORDER BY signup.created_at DESC
    ),
    '[]'::jsonb
  ) INTO signup_rows
  FROM (
    SELECT email, created_at, raw_user_meta_data
    FROM auth.users
    WHERE email IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 25
  ) AS signup;

  RETURN jsonb_build_object(
    'total_members', member_total,
    'recent_signups', signup_rows
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_activity_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_activity_summary() TO authenticated;

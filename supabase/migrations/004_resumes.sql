CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'My Academic CV' CHECK (char_length(title) BETWEEN 1 AND 120),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(data) <= 100000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, title)
);

CREATE INDEX IF NOT EXISTS resumes_user_updated_idx ON public.resumes (user_id, updated_at DESC);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resumes owner access" ON public.resumes;
CREATE POLICY "resumes owner access" ON public.resumes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.resumes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;

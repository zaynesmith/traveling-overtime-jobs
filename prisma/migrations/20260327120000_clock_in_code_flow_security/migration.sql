-- Aligns clock-in code flow with current table columns and enforces role-scoped access.

CREATE OR REPLACE FUNCTION public.clock_in(
  p_assignment_id uuid,
  p_entered_code text,
  p_timezone text DEFAULT 'UTC'::text,
  p_latitude numeric DEFAULT NULL::numeric,
  p_longitude numeric DEFAULT NULL::numeric,
  p_device_metadata jsonb DEFAULT '{}'::jsonb,
  p_notes text DEFAULT NULL::text
)
RETURNS TABLE (
  punch_id uuid,
  assignment_id uuid,
  punch_type text,
  punch_timestamp_utc timestamptz,
  clock_code_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment public.job_order_assignments%ROWTYPE;
  v_job_order public.job_orders%ROWTYPE;
  v_now timestamptz := now();
  v_local_work_date date;
  v_clock_code_id uuid;
BEGIN
  SELECT *
  INTO v_assignment
  FROM public.job_order_assignments a
  WHERE a.id = p_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'assignment_not_found';
  END IF;

  SELECT *
  INTO v_job_order
  FROM public.job_orders jo
  WHERE jo.id = v_assignment.job_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_order_not_found';
  END IF;

  IF COALESCE(trim(p_entered_code), '') = '' THEN
    RAISE EXCEPTION 'invalid clock code';
  END IF;

  -- Use existing validator for centralized business rules and auditing side effects.
  PERFORM public.validate_time_code_for_assignment(
    p_assignment_id,
    'clock_in',
    p_entered_code
  );

  SELECT tcc.id
  INTO v_clock_code_id
  FROM public.time_clock_codes tcc
  WHERE tcc.employer_id = v_assignment.employer_id
    AND (tcc.project_id IS NULL OR tcc.project_id = v_job_order.project_id)
    AND tcc.code_type = 'clock_in'
    AND tcc.code_date = (v_now AT TIME ZONE COALESCE(NULLIF(p_timezone, ''), 'UTC'))::date
    AND tcc.active = true
    AND v_now BETWEEN tcc.valid_from AND tcc.valid_to
    AND tcc.code = p_entered_code
  ORDER BY tcc.project_id NULLS LAST, tcc.created_at DESC
  LIMIT 1;

  IF v_clock_code_id IS NULL THEN
    RAISE EXCEPTION 'invalid or expired clock code';
  END IF;

  v_local_work_date := (v_now AT TIME ZONE COALESCE(NULLIF(p_timezone, ''), 'UTC'))::date;

  INSERT INTO public.time_punches (
    employer_id,
    jobseeker_id,
    project_id,
    job_order_id,
    assignment_id,
    local_work_date,
    punch_timestamp_utc,
    punch_timestamp_local,
    timezone,
    type,
    source,
    clock_code_id,
    entered_code_hash,
    latitude,
    longitude,
    geofence_status,
    device_metadata,
    notes,
    created_by
  )
  VALUES (
    v_assignment.employer_id,
    v_assignment.jobseeker_id,
    v_job_order.project_id,
    v_assignment.job_order_id,
    v_assignment.id,
    v_local_work_date,
    v_now,
    v_now,
    COALESCE(NULLIF(p_timezone, ''), 'UTC'),
    'clock_in',
    'web',
    v_clock_code_id,
    encode(digest(p_entered_code, 'sha256'), 'hex'),
    p_latitude::double precision,
    p_longitude::double precision,
    'unknown',
    COALESCE(p_device_metadata, '{}'::jsonb),
    p_notes,
    auth.uid()
  )
  RETURNING
    time_punches.id,
    time_punches.assignment_id,
    time_punches.type::text,
    time_punches.punch_timestamp_utc,
    time_punches.clock_code_id
  INTO punch_id, assignment_id, punch_type, punch_timestamp_utc, clock_code_id;

  UPDATE public.time_clock_codes
  SET used_count = used_count + 1
  WHERE id = v_clock_code_id;

  RETURN NEXT;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'time_clock_codes'
  ) THEN
    EXECUTE 'ALTER TABLE public.time_clock_codes ENABLE ROW LEVEL SECURITY';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'time_clock_codes'
      AND policyname = 'employer_select_own_clock_codes'
  ) THEN
    EXECUTE '
      CREATE POLICY employer_select_own_clock_codes
      ON public.time_clock_codes
      FOR SELECT
      USING (employer_id = public.get_current_employer_id())
    ';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'time_clock_codes'
      AND policyname = 'employer_insert_own_clock_codes'
  ) THEN
    EXECUTE '
      CREATE POLICY employer_insert_own_clock_codes
      ON public.time_clock_codes
      FOR INSERT
      WITH CHECK (employer_id = public.get_current_employer_id())
    ';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'time_clock_codes'
      AND policyname = 'employer_update_own_clock_codes'
  ) THEN
    EXECUTE '
      CREATE POLICY employer_update_own_clock_codes
      ON public.time_clock_codes
      FOR UPDATE
      USING (employer_id = public.get_current_employer_id())
      WITH CHECK (employer_id = public.get_current_employer_id())
    ';
  END IF;
END;
$$;

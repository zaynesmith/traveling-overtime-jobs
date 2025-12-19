-- Add throttling column for job alert emails
ALTER TABLE public.jobseekerprofile
  ADD COLUMN IF NOT EXISTS last_job_alert_sent_at TIMESTAMPTZ NULL;

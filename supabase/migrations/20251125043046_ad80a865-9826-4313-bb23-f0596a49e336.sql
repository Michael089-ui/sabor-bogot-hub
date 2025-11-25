-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule weekly restaurant population (every Sunday at 3 AM Bogotá time)
-- This will automatically keep the restaurant cache fresh with thousands of places
SELECT cron.schedule(
  'populate-restaurants-weekly',
  '0 3 * * 0', -- Cron: Every Sunday at 3:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://ozladdazcubyvmgdpyop.supabase.co/functions/v1/populate-restaurants',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bGFkZGF6Y3VieXZtZ2RweW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTgwNDgsImV4cCI6MjA3ODk3NDA0OH0.YHMF_zUlS38OaEKslI7_BjQ6q86Xyy9hZZnYTJNQ-gc"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Optional: You can also trigger an immediate execution manually by running:
-- SELECT net.http_post(
--     url:='https://ozladdazcubyvmgdpyop.supabase.co/functions/v1/populate-restaurants',
--     headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bGFkZGF6Y3VieXZtZ2RweW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTgwNDgsImV4cCI6MjA3ODk3NDA0OH0.YHMF_zUlS38OaEKslI7_BjQ6q86Xyy9hZZnYTJNQ-gc"}'::jsonb,
--     body:='{}'::jsonb
-- ) as request_id;
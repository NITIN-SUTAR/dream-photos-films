-- Scheduled maintenance. On Supabase these run through pg_cron.
-- Locally (or on hosts without pg_cron) the same work is exposed as idempotent
-- job endpoints: POST /api/jobs/expire-bookings and /api/jobs/process-notifications
-- guarded by the CRON_SECRET header.
create extension if not exists pg_cron;

select cron.schedule('dpf-expire-pending', '*/15 * * * *', $$select expire_pending_bookings()$$);

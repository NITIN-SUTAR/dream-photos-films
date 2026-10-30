-- ============================================================
-- DREAM PHOTO'S & FILM'S — in-app admin notifications
-- Persistent notification system for booking requests, status
-- changes, calendar events, and studio content publishing.
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'BOOKING',
  entity_type text,
  entity_id text,
  link text,
  role_scope text NOT NULL DEFAULT 'TEAM',
  read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  read_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  dedupe_key text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_notifications_created_idx ON admin_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notifications_read_idx ON admin_notifications (read, role_scope);
CREATE INDEX IF NOT EXISTS admin_notifications_dedupe_idx ON admin_notifications (dedupe_key);

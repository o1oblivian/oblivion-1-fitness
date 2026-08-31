/*
# Create support_tickets table

1. New Tables
  - `support_tickets`
    - `id` (uuid, primary key)
    - `user_id` (uuid, nullable, references auth.users)
    - `user_email` (text, not null, default empty)
    - `category` (text, not null)
    - `subject` (text, not null)
    - `message` (text, not null)
    - `device_info` (jsonb, nullable)
    - `status` (text, default 'open')
    - `created_at` (timestamptz, default now())

2. Security
  - RLS enabled.
  - Authenticated users can insert tickets (user_id defaults to auth.uid()).
  - Authenticated users can read their own tickets.
  - Anon users can submit tickets (user_id will be null).
*/

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL DEFAULT '',
  category text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  device_info jsonb,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_insert_tickets" ON support_tickets;
CREATE POLICY "anon_insert_tickets" ON support_tickets FOR INSERT
  TO anon WITH CHECK (user_id IS NULL);

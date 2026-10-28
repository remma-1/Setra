/*
# Create WorkDesk core tables

1. New Tables
- `workdesk_clients` stores shared client and contact records for the workspace.
  - `id` unique client identifier.
  - `name` client or company name.
  - `contact_name` primary contact name.
  - `email` primary contact email.
  - `phone` optional phone number.
  - `company` optional company or project label.
  - `notes` optional context about the relationship.
  - `created_at` record creation time.
- `workdesk_tasks` stores shared work tasks.
  - `id` unique task identifier.
  - `title` task title.
  - `client_name` optional client label shown with the task.
  - `due_date` optional due date.
  - `status` task status (`todo`, `in_progress`, or `done`).
  - `priority` task priority (`low`, `medium`, or `high`).
  - `created_at` record creation time.

2. Security
- Enable row-level security on both tables.
- Grant CRUD access to anon and authenticated roles for this single shared workspace.
- Add separate policies for each CRUD operation.

3. Seed Data
- Add a small set of realistic starter records only when each table is empty.
- Seed data is intentionally shared so the first version works without a sign-in screen.
*/

CREATE TABLE IF NOT EXISTS public.workdesk_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workdesk_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_name text,
  due_date date,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workdesk_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workdesk_tasks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workdesk_clients TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workdesk_tasks TO anon, authenticated;

DROP POLICY IF EXISTS "Shared workspace can read clients" ON public.workdesk_clients;
CREATE POLICY "Shared workspace can read clients" ON public.workdesk_clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared workspace can add clients" ON public.workdesk_clients;
CREATE POLICY "Shared workspace can add clients" ON public.workdesk_clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can edit clients" ON public.workdesk_clients;
CREATE POLICY "Shared workspace can edit clients" ON public.workdesk_clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can remove clients" ON public.workdesk_clients;
CREATE POLICY "Shared workspace can remove clients" ON public.workdesk_clients FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Shared workspace can read tasks" ON public.workdesk_tasks;
CREATE POLICY "Shared workspace can read tasks" ON public.workdesk_tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared workspace can add tasks" ON public.workdesk_tasks;
CREATE POLICY "Shared workspace can add tasks" ON public.workdesk_tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can edit tasks" ON public.workdesk_tasks;
CREATE POLICY "Shared workspace can edit tasks" ON public.workdesk_tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can remove tasks" ON public.workdesk_tasks;
CREATE POLICY "Shared workspace can remove tasks" ON public.workdesk_tasks FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS workdesk_tasks_due_date_idx ON public.workdesk_tasks (due_date);
CREATE INDEX IF NOT EXISTS workdesk_tasks_status_idx ON public.workdesk_tasks (status);
CREATE INDEX IF NOT EXISTS workdesk_clients_name_idx ON public.workdesk_clients (name);

INSERT INTO public.workdesk_clients (name, contact_name, email, phone, company, notes)
SELECT 'Apex Creative', 'Maya Chen', 'maya@apexcreative.co', '(415) 555-0182', 'Brand refresh', 'Weekly check-in on Thursdays.'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_clients);

INSERT INTO public.workdesk_clients (name, contact_name, email, phone, company, notes)
SELECT 'Northstar Labs', 'Jordan Bell', 'jordan@northstarlabs.io', '(206) 555-0147', 'Website launch', 'Prefers email for project updates.'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_clients WHERE name = 'Northstar Labs');

INSERT INTO public.workdesk_clients (name, contact_name, email, phone, company, notes)
SELECT 'Harbor & Co.', 'Sam Rivera', 'sam@harborandco.com', '(312) 555-0164', 'Operations support', 'New client, onboarding this month.'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_clients WHERE name = 'Harbor & Co.');

INSERT INTO public.workdesk_tasks (title, client_name, due_date, status, priority)
SELECT 'Finalize Q4 budget presentation', 'Apex Creative', CURRENT_DATE, 'todo', 'high'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_tasks WHERE title = 'Finalize Q4 budget presentation');

INSERT INTO public.workdesk_tasks (title, client_name, due_date, status, priority)
SELECT 'Send client follow-up email', 'Northstar Labs', CURRENT_DATE, 'in_progress', 'medium'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_tasks WHERE title = 'Send client follow-up email');

INSERT INTO public.workdesk_tasks (title, client_name, due_date, status, priority)
SELECT 'Review homepage feedback', 'Apex Creative', CURRENT_DATE + 1, 'todo', 'medium'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_tasks WHERE title = 'Review homepage feedback');

INSERT INTO public.workdesk_tasks (title, client_name, due_date, status, priority)
SELECT 'Prepare Monday project notes', 'Harbor & Co.', CURRENT_DATE + 3, 'todo', 'low'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_tasks WHERE title = 'Prepare Monday project notes');

INSERT INTO public.workdesk_tasks (title, client_name, due_date, status, priority)
SELECT 'Share launch timeline', 'Northstar Labs', CURRENT_DATE - 1, 'done', 'high'
WHERE NOT EXISTS (SELECT 1 FROM public.workdesk_tasks WHERE title = 'Share launch timeline');
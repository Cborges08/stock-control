-- Migration: profiles table
-- Phase 3 — Authentication
-- Creates the public.profiles table for storing display_name and role mirror.
-- Security roles for middleware guards live in app_metadata (not here).
-- This table provides display_name for the sidebar and a readable role label.

-- Create table
CREATE TABLE public.profiles (
  id            uuid        NOT NULL,
  role          text        NOT NULL CHECK (role IN ('admin', 'operator')),
  display_name  text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Comment
COMMENT ON TABLE public.profiles IS
  'User display data for sidebar rendering. Security roles for RBAC guards live in auth.users.app_metadata — not here.';

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read only their own profile row
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for authenticated role:
-- profiles rows are inserted exclusively by the service role (seed-users.ts script)
-- and are not user-editable in Phase 3.

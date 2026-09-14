-- ==============================================================================
-- SAHAKARI SEVA — COMPLETE SUPABASE DATABASE SCHEMA MIGRATION
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> Project (cvbraoniruzplwxbgzja) -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  booking_code TEXT,
  customer_id TEXT,
  worker_id TEXT,
  service_category_id TEXT,
  cooperative_id TEXT,
  booking_date TEXT,
  booking_time TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_description TEXT,
  estimated_amount NUMERIC,
  final_amount NUMERIC,
  is_emergency BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  completion_requested BOOLEAN DEFAULT FALSE,
  completion_requested_at TEXT,
  completion_code TEXT,
  completion_qr_payload TEXT,
  supplemental_bill JSONB,
  customer JSONB,
  worker JSONB,
  service_category JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 2. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  invoice_number TEXT,
  customer_id TEXT,
  worker_id TEXT,
  subtotal NUMERIC,
  platform_fee NUMERIC DEFAULT 0,
  cooperative_share NUMERIC DEFAULT 0,
  worker_amount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total_amount NUMERIC,
  payment_status TEXT DEFAULT 'paid',
  customer_name TEXT,
  worker_name TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 3. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 4. WORKERS TABLE
CREATE TABLE IF NOT EXISTS public.workers (
  id TEXT PRIMARY KEY,
  profile_id TEXT,
  cooperative_id TEXT,
  worker_code TEXT,
  skill_category TEXT,
  skills JSONB,
  experience_years NUMERIC,
  bio TEXT,
  service_area TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_updated_at TEXT,
  location_accuracy NUMERIC,
  service_radius_km NUMERIC,
  hourly_or_base_rate NUMERIC,
  availability_status TEXT DEFAULT 'available',
  verification_status TEXT DEFAULT 'verified',
  average_rating NUMERIC DEFAULT 4.8,
  total_jobs NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  welfare_status TEXT,
  insurance_status TEXT,
  certification_name TEXT,
  certification_url TEXT,
  verification_notes TEXT,
  profile JSONB,
  cooperative JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 5. CUSTOMER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer',
  profile_photo TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  language TEXT DEFAULT 'en',
  membership_id TEXT,
  total_spent NUMERIC DEFAULT 0,
  coop_savings NUMERIC DEFAULT 0,
  welfare_contribution NUMERIC DEFAULT 0,
  saved_addresses JSONB,
  emergency_contacts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 6. RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  customer_id TEXT,
  worker_id TEXT,
  rating NUMERIC,
  feedback TEXT,
  tags JSONB,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 7. WELFARE TABLE
CREATE TABLE IF NOT EXISTS public.welfare (
  id TEXT PRIMARY KEY,
  worker_id TEXT,
  welfare_scheme TEXT,
  enrollment_status TEXT,
  contribution_balance NUMERIC DEFAULT 0,
  insurance_status TEXT,
  insurance_provider TEXT,
  policy_reference TEXT,
  valid_until TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 8. IMMUTABLE AUDIT MUTATION CHANGELOG TABLE
CREATE TABLE IF NOT EXISTS public.changelog (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable anonymous read, write, update and delete using Publishable/Anon API Key
-- ==============================================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public full access bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public full access invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public full access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public full access workers" ON public.workers;
DROP POLICY IF EXISTS "Public full access customer_profiles" ON public.customer_profiles;
DROP POLICY IF EXISTS "Public full access ratings" ON public.ratings;
DROP POLICY IF EXISTS "Public full access welfare" ON public.welfare;
DROP POLICY IF EXISTS "Public full access changelog" ON public.changelog;

-- Create full open access policies for public/anon key
CREATE POLICY "Public full access bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access customer_profiles" ON public.customer_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access ratings" ON public.ratings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access welfare" ON public.welfare FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access changelog" ON public.changelog FOR ALL USING (true) WITH CHECK (true);

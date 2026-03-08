-- PROJ-4: Schadensmeldung erstellen (Mieter-Portal)
-- Database migration for damage_reports and damage_report_photos tables

-- =============================================================================
-- 1. Case number sequence table (per organization, resets yearly)
-- =============================================================================
CREATE TABLE IF NOT EXISTS case_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, year)
);

ALTER TABLE case_number_sequences ENABLE ROW LEVEL SECURITY;

-- Only service role needs to access this (via function), no direct user access
CREATE POLICY "No direct access to case_number_sequences" ON case_number_sequences
  FOR ALL USING (false);

-- =============================================================================
-- 2. Function to generate sequential case numbers per organization
-- Format: SCH-YYYY-XXXXX (e.g. SCH-2026-00001)
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_case_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year INT;
  next_number INT;
  case_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INT;

  -- Upsert: increment or create sequence for this org+year
  INSERT INTO case_number_sequences (organization_id, year, last_number)
  VALUES (org_id, current_year, 1)
  ON CONFLICT (organization_id, year)
  DO UPDATE SET
    last_number = case_number_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO next_number;

  case_number := 'SCH-' || current_year::TEXT || '-' || LPAD(next_number::TEXT, 5, '0');
  RETURN case_number;
END;
$$;

-- =============================================================================
-- 3. Damage reports table
-- =============================================================================
CREATE TABLE IF NOT EXISTS damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL UNIQUE,

  -- Structured category fields (for AI/insurance extraction)
  category TEXT NOT NULL CHECK (category IN (
    'wasserschaden', 'heizung', 'elektrik', 'fenster_tueren',
    'schimmel', 'sanitaer', 'boeden_waende', 'aussenbereich', 'sonstiges'
  )),
  subcategory TEXT,
  room TEXT CHECK (room IS NULL OR room IN (
    'kueche', 'bad', 'wc', 'schlafzimmer', 'wohnzimmer',
    'flur', 'keller', 'balkon', 'terrasse', 'sonstiges'
  )),

  -- Core description
  title TEXT NOT NULL,
  description TEXT,

  -- Urgency
  urgency TEXT NOT NULL CHECK (urgency IN ('notfall', 'dringend', 'normal')) DEFAULT 'normal',

  -- Appointment / access
  preferred_appointment TIMESTAMPTZ,
  access_notes TEXT,

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'neu', 'in_bearbeitung', 'warte_auf_handwerker',
    'termin_vereinbart', 'erledigt', 'abgelehnt'
  )) DEFAULT 'neu',

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;

-- Tenants can see their own reports
CREATE POLICY "Tenants see own damage reports" ON damage_reports
  FOR SELECT USING (
    reporter_id = auth.uid()
  );

-- HV staff can see all reports in their organization
CREATE POLICY "HV staff see org damage reports" ON damage_reports
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_deleted = false
    )
  );

-- Tenants can create reports (only for their own org/unit)
CREATE POLICY "Tenants create damage reports" ON damage_reports
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() AND is_deleted = false)
    AND unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid() AND is_deleted = false)
  );

-- HV staff can update reports in their organization (status changes etc.)
CREATE POLICY "HV staff update damage reports" ON damage_reports
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_deleted = false
    )
  );

-- Indexes for performance
CREATE INDEX idx_damage_reports_organization_id ON damage_reports(organization_id);
CREATE INDEX idx_damage_reports_reporter_id ON damage_reports(reporter_id);
CREATE INDEX idx_damage_reports_unit_id ON damage_reports(unit_id);
CREATE INDEX idx_damage_reports_status ON damage_reports(status);
CREATE INDEX idx_damage_reports_urgency ON damage_reports(urgency);
CREATE INDEX idx_damage_reports_category ON damage_reports(category);
CREATE INDEX idx_damage_reports_created_at ON damage_reports(created_at DESC);
CREATE INDEX idx_damage_reports_case_number ON damage_reports(case_number);

-- =============================================================================
-- 4. Damage report photos table
-- =============================================================================
CREATE TABLE IF NOT EXISTS damage_report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID REFERENCES damage_reports(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/heic')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE damage_report_photos ENABLE ROW LEVEL SECURITY;

-- Tenants can see photos of their own reports (or their own orphaned uploads)
CREATE POLICY "Tenants see own report photos" ON damage_report_photos
  FOR SELECT USING (
    uploaded_by = auth.uid()
    OR damage_report_id IN (
      SELECT id FROM damage_reports WHERE reporter_id = auth.uid()
    )
  );

-- HV staff can see photos in their org
CREATE POLICY "HV staff see org report photos" ON damage_report_photos
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_deleted = false
    )
  );

-- Tenants can insert photos (orphaned initially, linked when report is created)
CREATE POLICY "Tenants insert report photos" ON damage_report_photos
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() AND is_deleted = false)
  );

-- Tenants can update their own orphaned photos (to link them to a report)
CREATE POLICY "Tenants update own orphaned photos" ON damage_report_photos
  FOR UPDATE USING (
    uploaded_by = auth.uid()
    AND damage_report_id IS NULL
  );

-- Indexes
CREATE INDEX idx_damage_report_photos_report_id ON damage_report_photos(damage_report_id);
CREATE INDEX idx_damage_report_photos_organization_id ON damage_report_photos(organization_id);

-- =============================================================================
-- 5. Create private storage bucket for damage photos
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'damage-photos',
  'damage-photos',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Tenants can upload to their org's folder
CREATE POLICY "Tenants upload damage photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'damage-photos'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::TEXT FROM profiles WHERE id = auth.uid() AND is_deleted = false
    )
  );

-- Storage RLS: Users can read photos in their org
CREATE POLICY "Users read own org damage photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'damage-photos'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::TEXT FROM profiles WHERE id = auth.uid() AND is_deleted = false
    )
  );

-- =============================================================================
-- 6. Updated_at trigger for damage_reports
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_damage_reports_updated_at'
  ) THEN
    CREATE TRIGGER set_damage_reports_updated_at
      BEFORE UPDATE ON damage_reports
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

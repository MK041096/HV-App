-- Add status, units_estimate, phone to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS units_estimate TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;

-- Existing orgs stay active
UPDATE organizations SET status = 'active' WHERE status IS NULL OR status = '';

-- Add check constraint
DO $$ BEGIN
  ALTER TABLE organizations ADD CONSTRAINT organizations_status_check
    CHECK (status IN ('pending', 'active', 'suspended'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

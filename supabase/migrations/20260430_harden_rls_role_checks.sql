-- ═══════════════════════════════════════════════════════════
-- Sicherheits-Härtung: RLS-Policies mit echtem Rollen-Check
-- ═══════════════════════════════════════════════════════════
-- Ohne diese Policies könnte ein Mieter via direktem API-Call
-- die Schadensmeldungen / Mietverträge / Werkstätten / Profile
-- ALLER Mieter seiner Hausverwaltung lesen — DSGVO-Verstoß.
-- Nach dieser Migration: Mieter sieht nur eigene Daten,
-- HV-Personal sieht alle Daten der eigenen Org.

-- ── Helper: aktuelle Rolle aus profiles (single source of truth) ──
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid()
    AND is_deleted = false
  LIMIT 1;
$$;

-- ── is_platform_admin: aus profiles statt user_roles (user_roles ist leer) ──
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_deleted = false
      AND role = 'platform_admin'
  );
$$;

-- ── 1. damage_reports SELECT/UPDATE ──
DROP POLICY IF EXISTS "HV staff see org damage reports" ON damage_reports;
CREATE POLICY "HV staff see org damage reports"
  ON damage_reports FOR SELECT
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

DROP POLICY IF EXISTS "HV staff update damage reports" ON damage_reports;
CREATE POLICY "HV staff update damage reports"
  ON damage_reports FOR UPDATE
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

-- ── 2. damage_report_photos SELECT ──
DROP POLICY IF EXISTS "HV staff see org report photos" ON damage_report_photos;
CREATE POLICY "HV staff see org report photos"
  ON damage_report_photos FOR SELECT
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

-- ── 3. damage_report_status_history: Duplikat ohne Rollencheck entfernen ──
DROP POLICY IF EXISTS "HV staff see status history" ON damage_report_status_history;
DROP POLICY IF EXISTS "Tenants see own status history" ON damage_report_status_history;

-- ── 4. appointment_tokens (Public-Token-SELECT bleibt für Werkstatt-Links) ──
DROP POLICY IF EXISTS "HV staff see tokens" ON appointment_tokens;
CREATE POLICY "HV staff see tokens"
  ON appointment_tokens FOR ALL
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

-- ── 5. documents (Mietverträge, Versicherungspolicen) ──
DROP POLICY IF EXISTS "hv_can_manage_documents" ON documents;
CREATE POLICY "hv_can_manage_documents"
  ON documents FOR ALL
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

-- ── 6. contractors ──
DROP POLICY IF EXISTS "HV staff manage contractors" ON contractors;
CREATE POLICY "HV staff manage contractors"
  ON contractors FOR ALL
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

-- ── 7. profiles: Org-weiter Zugriff nur für HV-Staff ──
-- (profiles_select_self bleibt: jeder sieht sein eigenes Profil)
DROP POLICY IF EXISTS "profiles_select_own_org" ON profiles;
CREATE POLICY "profiles_select_own_org"
  ON profiles FOR SELECT
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

-- ── 8. units: HV sieht alle Org-Einheiten, Mieter nur die eigene ──
DROP POLICY IF EXISTS "units_select_own_org" ON units;
CREATE POLICY "units_select_hv_org"
  ON units FOR SELECT
  USING (
    is_platform_admin()
    OR (
      organization_id = get_user_organization_id()
      AND current_user_role() IN ('hv_admin', 'hv_mitarbeiter')
    )
  );

CREATE POLICY "units_select_own_unit_tenant"
  ON units FOR SELECT
  USING (
    id = (
      SELECT unit_id FROM public.profiles
      WHERE id = auth.uid()
        AND is_deleted = false
        AND role = 'mieter'
    )
  );

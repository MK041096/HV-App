-- BUG: damage_report_status_history.new_status_check enthielt 'termin_telefonisch' nicht
-- Folge: Werkstatt-Klick auf "Termin telefonisch vereinbaren" liess den Status auf
-- 'warte_auf_handwerker' haengen, weil der Trigger den Insert in die History wegen
-- Constraint-Verletzung abbrach und damit auch den UPDATE auf damage_reports rollback machte
-- Symptom: Token wurde "confirmed", aber Status nicht aktualisiert, kein History-Eintrag

ALTER TABLE damage_report_status_history
  DROP CONSTRAINT IF EXISTS damage_report_status_history_new_status_check;

ALTER TABLE damage_report_status_history
  ADD CONSTRAINT damage_report_status_history_new_status_check
  CHECK (new_status = ANY (ARRAY[
    'neu'::text,
    'in_bearbeitung'::text,
    'warte_auf_handwerker'::text,
    'termin_vereinbart'::text,
    'termin_telefonisch'::text,
    'erledigt'::text,
    'abgelehnt'::text
  ]));

-- old_status auch erweitern falls dort gleicher Constraint existiert
DO $$
DECLARE
  has_old_check boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'damage_report_status_history'::regclass
      AND conname = 'damage_report_status_history_old_status_check'
  ) INTO has_old_check;

  IF has_old_check THEN
    ALTER TABLE damage_report_status_history
      DROP CONSTRAINT damage_report_status_history_old_status_check;
    ALTER TABLE damage_report_status_history
      ADD CONSTRAINT damage_report_status_history_old_status_check
      CHECK (old_status IS NULL OR old_status = ANY (ARRAY[
        'neu'::text,
        'in_bearbeitung'::text,
        'warte_auf_handwerker'::text,
        'termin_vereinbart'::text,
        'termin_telefonisch'::text,
        'erledigt'::text,
        'abgelehnt'::text
      ]));
  END IF;
END $$;

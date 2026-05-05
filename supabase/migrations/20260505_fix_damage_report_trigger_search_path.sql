-- BUG: fn_damage_report_status_change() und fn_damage_report_initial_status()
-- hatten search_path='' (Supabase-Security-Pattern), referenzierten aber
-- public.damage_report_status_history ohne Schema-Praefix.
-- Folge: ALLE UPDATEs/INSERTs auf damage_reports schlugen mit
-- "relation does not exist" fehl.
-- Fix: Tabellen-Referenzen mit public.-Praefix qualifizieren.

CREATE OR REPLACE FUNCTION public.fn_damage_report_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.damage_report_status_history (
      damage_report_id, organization_id, old_status, new_status, changed_by
    ) VALUES (
      NEW.id, NEW.organization_id, OLD.status, NEW.status, auth.uid()
    );

    IF NEW.status = 'erledigt' AND OLD.status != 'erledigt' THEN
      NEW.closed_at = now();
    END IF;

    IF OLD.status = 'erledigt' AND NEW.status != 'erledigt' THEN
      NEW.closed_at = NULL;
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_damage_report_initial_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.damage_report_status_history (
    damage_report_id, organization_id, old_status, new_status, changed_by
  ) VALUES (
    NEW.id, NEW.organization_id, NULL, NEW.status, NEW.reporter_id
  );
  RETURN NEW;
END;
$function$;

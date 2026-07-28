CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.can_access_repair_object(text) SET SCHEMA private;
ALTER FUNCTION public.handle_new_user() SET SCHEMA private;
ALTER FUNCTION public.update_updated_at_column() SET SCHEMA private;

ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public, private;
ALTER FUNCTION private.can_access_repair_object(text) SET search_path = public, private;
ALTER FUNCTION private.handle_new_user() SET search_path = public, private;
ALTER FUNCTION private.update_updated_at_column() SET search_path = public, private;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_access_repair_object(text) TO authenticated, service_role;
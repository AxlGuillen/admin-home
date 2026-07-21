-- 002_home_lock_down_functions
--
-- `home_handle_new_user()` es SECURITY DEFINER porque escribe en home_profiles al
-- registrarse un usuario, antes de que exista sesión. Pero al vivir en el schema
-- `public` quedó expuesta como RPC en /rest/v1/rpc/, o sea que cualquiera podía
-- llamarla directo con privilegios elevados.
--
-- Los triggers NO pasan por el permiso EXECUTE, así que revocarlo no rompe el alta
-- automática de perfil; solo cierra la puerta del API.

revoke execute on function public.home_handle_new_user() from public, anon, authenticated;
revoke execute on function public.home_set_updated_at() from public, anon, authenticated;

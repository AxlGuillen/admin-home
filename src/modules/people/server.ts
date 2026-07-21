/**
 * Entry point **de servidor** del módulo.
 *
 * Las queries importan `server-only` y el cliente de Supabase de servidor. Si
 * vivieran en `index.ts`, cualquier Client Component que importara el módulo
 * arrastraría ese código al bundle del navegador y el build fallaría.
 *
 * Regla: Server Components y Server Actions usan `@/modules/people/server`;
 * todo lo demás usa `@/modules/people`.
 */
export { listPeople, toPerson } from "./queries";

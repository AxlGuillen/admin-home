/**
 * Contrato público del módulo. Seguro de importar desde cliente y servidor.
 *
 * Las queries NO van aquí: importan `server-only` y arrastrarían código de servidor
 * al bundle del navegador. Van en `server.ts`. Las actions sí, porque `"use server"`
 * hace que Next las reemplace por un stub RPC en el cliente.
 *
 * Lo que no se exporte en uno de los dos entry points es privado, y ESLint bloquea
 * que se importe desde fuera.
 */
export { createExample } from "./actions";
export {
  createExampleSchema,
  exampleSchema,
  updateExampleSchema,
} from "./schemas";
export type {
  CreateExampleInput,
  Example,
  UpdateExampleInput,
} from "./types";

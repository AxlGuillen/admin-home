/**
 * Contrato público del módulo. Lo que no se exporte aquí es privado y ESLint
 * bloqueará que se importe desde fuera (`boundaries/entry-point`).
 */
export { createExample } from "./actions";
export { listExamples } from "./queries";
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

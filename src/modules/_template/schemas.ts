import { z } from "zod";

/**
 * Fuente de verdad del dominio. Todo campo nuevo nace aquí; los tipos se infieren,
 * la BD se alinea y los formularios validan contra esto.
 */
export const exampleSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  createdAt: z.iso.datetime(),
});

/** Lo que el usuario envía al crear. El servidor pone `id` y `createdAt`. */
export const createExampleSchema = exampleSchema.omit({
  id: true,
  createdAt: true,
});

export const updateExampleSchema = createExampleSchema.partial().extend({
  id: z.uuid(),
});

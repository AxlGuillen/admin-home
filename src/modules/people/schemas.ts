import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const blankToNull = (value: unknown) =>
  value === undefined || (typeof value === "string" && value.trim() === "")
    ? null
    : value;

export const personInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(60, "Máximo 60 caracteres"),
  color: z.preprocess(
    blankToNull,
    z.string().regex(HEX_COLOR, "Color inválido").nullable(),
  ),
});

export const personSchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  userId: z.uuid().nullable(),
  name: z.string(),
  color: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

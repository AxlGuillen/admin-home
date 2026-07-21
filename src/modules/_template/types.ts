import type { z } from "zod";

import type {
  createExampleSchema,
  exampleSchema,
  updateExampleSchema,
} from "./schemas";

export type Example = z.infer<typeof exampleSchema>;
export type CreateExampleInput = z.infer<typeof createExampleSchema>;
export type UpdateExampleInput = z.infer<typeof updateExampleSchema>;

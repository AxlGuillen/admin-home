import type { z } from "zod";

import type { personInputSchema, personSchema } from "./schemas";

export type Person = z.infer<typeof personSchema>;
export type PersonInput = z.infer<typeof personInputSchema>;

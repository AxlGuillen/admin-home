import { z } from "zod";

import { parseEnv } from "./parse-env";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

// Revienta en build, no en runtime, porque Next inlinea las `NEXT_PUBLIC_*` al
// compilar: sin ellas el bundle saldría con `undefined` y la app fallaría en el
// navegador sin decir por qué. Ruidoso aquí es mejor que silencioso allá.
export const env = parseEnv(
  publicEnvSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  "Vercel → Settings → Environment Variables (o .env.local en tu máquina)",
);

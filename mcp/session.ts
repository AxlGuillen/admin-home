import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { z } from "zod";

export const SESSION_DIR = join(homedir(), ".admin-home");
export const SESSION_FILE = join(SESSION_DIR, "session.json");

const storedSessionSchema = z.object({
  email: z.string(),
  refreshToken: z.string().min(1),
  savedAt: z.string(),
});

export type StoredSession = z.infer<typeof storedSessionSchema>;

export function readSession(): StoredSession | null {
  try {
    return storedSessionSchema.parse(JSON.parse(readFileSync(SESSION_FILE, "utf8")));
  } catch {
    return null;
  }
}

// 0600 y fuera del repo: el refresh token abre la cuenta completa, así que no
// puede quedar legible para otros usuarios de la máquina ni acabar en un commit.
export function writeSession(session: StoredSession): void {
  mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(SESSION_FILE, `${JSON.stringify(session, null, 2)}\n`, {
    mode: 0o600,
  });
  chmodSync(SESSION_FILE, 0o600);
}

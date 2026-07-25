// Login interactivo del MCP. Guarda solo el refresh token: la contraseña no se
// escribe en ningún lado y no vuelve a pedirse hasta que la sesión caduque.

import { createInterface } from "node:readline";
import { Writable } from "node:stream";

import { publicClient } from "./client";
import { SESSION_FILE, writeSession } from "./session";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    let muted = false;
    const output = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) process.stdout.write(chunk, encoding);
        callback();
      },
    });

    const rl = createInterface({ input: process.stdin, output, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    // Después de `question` para que el prompt sí se imprima y solo se calle el eco.
    muted = hidden;
  });
}

const email = await ask("Correo: ");
const password = await ask("Contraseña: ", true);

const client = publicClient();
const { data, error } = await client.auth.signInWithPassword({ email, password });

if (error || !data.session) {
  console.error(`\nNo se pudo entrar: ${error?.message ?? "sin sesión"}`);
  process.exit(1);
}

const { data: membership } = await client
  .from("home_household_members")
  .select("household_id")
  .eq("user_id", data.session.user.id)
  .limit(1)
  .maybeSingle();

writeSession({
  email,
  refreshToken: data.session.refresh_token,
  savedAt: new Date().toISOString(),
});

console.log(`\nSesión guardada en ${SESSION_FILE} (solo lectura para tu usuario).`);
console.log(
  membership
    ? "La cuenta pertenece a un hogar: el MCP ya puede consultar."
    : "Ojo: la cuenta NO pertenece a ningún hogar, así que RLS no le mostrará datos.",
);

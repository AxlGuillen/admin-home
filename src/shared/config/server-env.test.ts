import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` truena fuera de un Server Component; aquí solo estorba.
vi.mock("server-only", () => ({}));

/** El parse vive a nivel de módulo, así que cada caso necesita una importación limpia. */
async function appUrlWith(env: Record<string, string | undefined>): Promise<string> {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const { appUrl } = await import("./server-env");
  return appUrl();
}

const CLEAN = { APP_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: undefined };
let original: NodeJS.ProcessEnv;

beforeEach(() => {
  original = { ...process.env };
});

afterEach(() => {
  process.env = original;
});

describe("appUrl", () => {
  it("APP_URL gana sobre todo lo demás", async () => {
    await expect(
      appUrlWith({
        APP_URL: "https://mi-dominio.com",
        VERCEL_PROJECT_PRODUCTION_URL: "otro.vercel.app",
      }),
    ).resolves.toBe("https://mi-dominio.com");
  });

  it("le quita la barra final, que ensuciaría el identificador del recurso", async () => {
    await expect(
      appUrlWith({ ...CLEAN, APP_URL: "https://mi-dominio.com/" }),
    ).resolves.toBe("https://mi-dominio.com");
  });

  // Vercel siempre define esta variable y apunta al dominio estable de producción.
  // Usar la del deploy rompería el conector en cada push.
  it("sin APP_URL, deriva del dominio de producción de Vercel", async () => {
    await expect(
      appUrlWith({ ...CLEAN, VERCEL_PROJECT_PRODUCTION_URL: "admin-home.vercel.app" }),
    ).resolves.toBe("https://admin-home.vercel.app");
  });

  it("sin nada, cae a localhost para desarrollo", async () => {
    await expect(appUrlWith(CLEAN)).resolves.toBe("http://localhost:3000");
  });

  it("un APP_URL que no es URL sigue fallando ruidosamente", async () => {
    await expect(appUrlWith({ ...CLEAN, APP_URL: "no-soy-una-url" })).rejects.toThrow(
      /Faltan variables de entorno/,
    );
  });

  // Copiar la URL del navegador estando en /login es el error natural, y daría
  // el identificador ".../login/api/mcp" sin que nada se queje.
  it("rechaza un APP_URL con ruta", async () => {
    await expect(
      appUrlWith({ ...CLEAN, APP_URL: "https://admin-home-theta.vercel.app/login" }),
    ).rejects.toThrow(/solo el origen/);
  });

  it("acepta el origen con barra final", async () => {
    await expect(
      appUrlWith({ ...CLEAN, APP_URL: "https://admin-home-theta.vercel.app/" }),
    ).resolves.toBe("https://admin-home-theta.vercel.app");
  });
});

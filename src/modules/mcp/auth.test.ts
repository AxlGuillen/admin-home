import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const memberships = vi.fn();
const allowed = vi.fn<() => string[]>(() => []);

vi.mock("./supabase", () => ({
  verifierClient: () => ({ auth: { getUser } }),
  clientForToken: () => ({
    from: () => ({ select: () => ({ eq: memberships }) }),
  }),
}));

vi.mock("@/shared/config/server-env", () => ({
  allowedClientIds: () => allowed(),
  appUrl: () => "https://example.com",
}));

const { resetIdentityCache, verifyToken } = await import("./auth");

/** Un token con la forma de un JWT: solo se lee el payload, la firma no se toca. */
function token(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${body}.signature`;
}

const USER = { id: "11111111-1111-1111-1111-111111111111", email: "yo@casa.mx" };

beforeEach(() => {
  resetIdentityCache();
  vi.clearAllMocks();
  allowed.mockReturnValue([]);
  getUser.mockResolvedValue({ data: { user: USER }, error: null });
  memberships.mockResolvedValue({ data: [{ household_id: "casa" }], error: null });
});

describe("verifyToken", () => {
  it("sin token no autentica", async () => {
    await expect(verifyToken(new Request("https://x/"), undefined)).resolves.toBeUndefined();
  });

  it("rechaza un token que GoTrue no reconoce", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "bad jwt" } });

    const result = await verifyToken(new Request("https://x/"), token({ client_id: "claude" }));
    expect(result).toBeUndefined();
  });

  // Un token de sesión de la app web es válido para Supabase pero no pasó por el
  // consentimiento, así que no debe abrir el conector.
  it("rechaza un token de sesión normal, que no trae client_id", async () => {
    const result = await verifyToken(new Request("https://x/"), token({ sub: USER.id }));
    expect(result).toBeUndefined();
  });

  it("rechaza un client_id fuera del allowlist", async () => {
    allowed.mockReturnValue(["el-de-claude"]);

    const result = await verifyToken(new Request("https://x/"), token({ client_id: "otro" }));
    expect(result).toBeUndefined();
  });

  it("acepta el client_id del allowlist", async () => {
    allowed.mockReturnValue(["el-de-claude"]);

    const result = await verifyToken(
      new Request("https://x/"),
      token({ client_id: "el-de-claude" }),
    );
    expect(result?.clientId).toBe("el-de-claude");
  });

  // Tener sesión no es tener acceso: auth.users es compartido con las apps ra_/adala_.
  it("rechaza a quien no pertenece a ningún hogar", async () => {
    memberships.mockResolvedValue({ data: [], error: null });

    const result = await verifyToken(new Request("https://x/"), token({ client_id: "claude" }));
    expect(result).toBeUndefined();
  });

  it("expone la identidad en extra, con el hogar como clave de caché", async () => {
    const result = await verifyToken(
      new Request("https://x/"),
      token({ client_id: "claude", exp: 1893456000 }),
    );

    expect(result?.extra).toEqual({
      userId: USER.id,
      email: USER.email,
      clientId: "claude",
      householdKey: "casa",
    });
    expect(result?.expiresAt).toBe(1893456000);
  });

  // La clave tiene que ser el conjunto ordenado: RLS devuelve la unión de hogares,
  // y con orden inestable la misma persona partiría la caché en dos.
  it("ordena el conjunto de hogares en householdKey", async () => {
    memberships.mockResolvedValue({
      data: [{ household_id: "zeta" }, { household_id: "alfa" }],
      error: null,
    });

    const result = await verifyToken(new Request("https://x/"), token({ client_id: "claude" }));
    expect((result?.extra as { householdKey: string }).householdKey).toBe("alfa,zeta");
  });

  it("no anuncia scopes ni audiencia que no verificó", async () => {
    const result = await verifyToken(new Request("https://x/"), token({ client_id: "claude" }));

    // Los tokens de Supabase no traen claim `scope`, y su `aud` es "authenticated":
    // afirmar cualquiera de los dos aquí sería mentir sobre lo que se validó.
    expect(result?.scopes).toEqual([]);
    expect(result?.resource).toBeUndefined();
  });

  it("no revalida contra GoTrue dentro del TTL", async () => {
    const bearer = token({ client_id: "claude" });
    await verifyToken(new Request("https://x/"), bearer);
    await verifyToken(new Request("https://x/"), bearer);

    expect(getUser).toHaveBeenCalledTimes(1);
  });
});

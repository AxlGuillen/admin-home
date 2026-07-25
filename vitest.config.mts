import { defineConfig } from "vitest/config";

/**
 * No usamos @vitejs/plugin-react: su cadena de peers arrastra Babel 8 y choca
 * con eslint-config-next. Vite 8 transpila JSX con Oxc leyendo el `jsx` del
 * tsconfig, así que no hace falta plugin para tests unitarios.
 *
 * Lo que sí falta es Fast Refresh, que en tests da igual.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "mcp/**/*.{test,spec}.ts"],
  },
});

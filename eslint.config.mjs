import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

/**
 * Además del preset de Next, aquí se hacen cumplir los límites del monolito
 * modular. Sin esto la separación por carpetas es decorativa: cualquier import
 * la rompe y nadie se entera hasta que el módulo ya es imposible de mover.
 *
 * El grafo permitido está documentado en AGENTS.md.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: { boundaries },
    settings: {
      // Sin este resolver, boundaries no entiende el alias `@/*` y trata todo
      // import interno como paquete externo — las reglas nunca se disparan.
      "import/resolver": {
        typescript: { alwaysTryTypes: true, project: "./tsconfig.json" },
      },
      "boundaries/elements": [
        // Los patrones describen CARPETAS, no archivos. Cada módulo es su
        // carpeta; `fileInternalPath` distingue index.ts del resto de sus archivos.
        { type: "module", pattern: "src/modules/*", capture: ["moduleName"] },
        { type: "app", pattern: "src/app" },
        { type: "mcp", pattern: "mcp" },
        { type: "shared", pattern: "src/shared" },
        { type: "ui", pattern: "src/components" },
        { type: "hooks", pattern: "src/hooks" },
        { type: "lib", pattern: "src/lib" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "off",

      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: ["app", "module", "shared", "ui", "hooks", "lib"],
                    },
                  },
                },
              },
            },
            {
              from: { element: { type: "module" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: ["module", "shared", "ui", "hooks", "lib"],
                    },
                  },
                },
              },
            },
            // El servidor MCP corre fuera de Next: consume módulos igual que `app`,
            // pero solo por entry points que no importen `server-only`.
            {
              from: { element: { type: "mcp" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["mcp", "module", "shared", "lib"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { types: { anyOf: ["shared", "lib"] } } } },
            },
            {
              from: { element: { type: "ui" } },
              allow: {
                to: { element: { types: { anyOf: ["ui", "hooks", "lib"] } } },
              },
            },
            {
              from: { element: { type: "hooks" } },
              allow: { to: { element: { types: { anyOf: ["hooks", "lib"] } } } },
            },
            {
              from: { element: { type: "lib" } },
              allow: { to: { element: { type: "lib" } } },
              message:
                "src/lib son utilidades puras: no deben importar nada del proyecto.",
            },
            // Desde fuera, un módulo solo se toca por sus entry points:
            // `index.ts` (cliente + servidor) o `server.ts` (solo servidor).
            {
              disallow: {
                to: {
                  element: {
                    type: "module",
                    fileInternalPath: "!(index|server|analytics-core).ts",
                  },
                },
              },
              message:
                "Importa el módulo por su entry point: @/modules/<nombre>, /server o /analytics-core.",
            },
            // …salvo el propio módulo, que sí ve sus archivos internos.
            {
              from: { element: { type: "module", capture: { moduleName: "*" } } },
              allow: {
                to: {
                  element: {
                    type: "module",
                    capture: { moduleName: "{{from.moduleName}}" },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },

  // shadcn/ui lo genera el CLI: no vale la pena pelear con sus convenciones.
  {
    files: ["src/components/ui/**", "src/hooks/use-mobile.ts"],
    rules: {
      "boundaries/dependencies": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/shared/supabase/database.types.ts",
  ]),
]);

export default eslintConfig;

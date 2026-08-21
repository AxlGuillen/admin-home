# Plan · Tour de pantallas con driver.js

> Objetivo: que alguien nuevo de la familia entienda cada pantalla en su primer
> uso — qué es la dominante, dónde están las fugas, cómo se navega — sin que
> nadie se lo explique.

## La librería, verificada

`driver.js` 1.8.0: publicada hace días, MIT, **cero dependencias**, vanilla
(sin wrapper de React). ~6 kB gzip en runtime. Al ser DOM puro entra solo en
Client Components y se carga con `import()` dinámico: no pesa en el bundle
inicial ni toca el server.

## Decisiones

### Un tour POR PANTALLA, no un mega-tour cruzado

driver.js es de una sola página; encadenar navegaciones del App Router entre
pasos (esperar el RSC, reanudar en la ruta nueva) es la parte frágil de
cualquier tour y no aporta: quien llega nuevo cae en Inicio. Cada pantalla
tiene su tour corto (4–6 pasos); el de Inicio además presenta el sidebar
(módulos, colapso, tema, sesión).

### Anclaje por `data-tour`, nunca por clases

Las clases de Tailwind cambian con cualquier retoque visual. Convención:
`data-tour="dominante"`, `data-tour="nav"`, etc. en los componentes. Los pasos
referencian eso y sobreviven al próximo rediseño.

### Visto = localStorage por dispositivo, no BD

`ah-tour:<pantalla>:v1`. Guardarlo en Supabase daría "visto en todos tus
dispositivos" a cambio de migración + RLS + action; para 4 personas no paga.
Subir `v1` → `v2` re-muestra un tour cuando una pantalla cambie fuerte.

### Disparo doble

1. **Auto una sola vez**: al entrar por primera vez a cada pantalla, arranca
   solo (tras el paint, no bloquea).
2. **Botón de ayuda permanente** en el pie del sidebar (junto al toggle de
   tema, clase `.ctl`): relanza el tour de la pantalla actual, resuelto por
   `pathname`. Nada de re-descubrir cómo verlo otra vez.

### El popover se rediseña al SKIN — obligatorio, no polish

El popover por defecto de driver.js es la card blanca genérica que el motor
prohíbe. Se importa su CSS base y se sobreescribe en `globals.css` con los
tokens: superficie `--surface`, radio `--r-card-sm`, sombra `--sh-raise`,
título con la eyebrow mono en mayúsculas, botones con el hover de instrumento,
progreso "2 de 5" en `.tnum`. Funciona en ambos temas gratis porque son
variables.

## Arquitectura (respeta los límites de ESLint)

| Pieza | Dónde | Capa |
| --- | --- | --- |
| `TourButton` + runner (carga driver.js, gating, arranque) | `src/components/tour.tsx` | `ui` — genérico, recibe pasos, no conoce módulos |
| Gating (`hasSeen`/`markSeen`, clave versionada) | `src/lib/tour-storage.ts` | `lib` — puro, testeable |
| Pasos de finanzas | `src/modules/finance/components/*` | módulo |
| Pasos de Inicio/Personas + botón en el sidebar | `src/app/(app)/*` | app |

`ui` no puede importar módulos (ESLint lo hace cumplir), así que el runner
recibe los pasos como prop y cada pantalla define los suyos donde vive.

## Fases

### Fase 1 · Motor ✅

Dependencia, runner con `import()` dinámico, gating en `lib` con tests, tema
del popover en ambos modos, textos en español ("Siguiente/Atrás/Listo",
"{{current}} de {{total}}"), `animate: false` bajo `prefers-reduced-motion`.

Detalles que quedaron distintos a lo planeado:

- **El CSS base de driver.js entra por `@import` en `globals.css`**, no en el
  componente: es la única forma de garantizar que los overrides del final del
  archivo le ganen por orden de cascada, sin `!important`.
- El título del popover se trata como **kicker** (mono, mayúsculas, tracking),
  el mismo patrón eyebrow de `PageHeading` — no como un heading genérico.
- El filtrado de anclajes ausentes quedó en el motor (`startTour`), no como
  tarea de la fase 3: sin él, cualquier banco de pruebas ya mostraba el paso
  huérfano flotando.
- `Siguiente/Listo` usan `--brand-fill`, siguiendo la regla del SKIN de nunca
  poner texto blanco sobre `--brand` pleno.

Verificado en navegador (ambos temas): auto-arranque en primera visita, "1 de
3" con 4 pasos definidos (el huérfano se filtró), Esc cierra y marca visto,
recarga ya no re-arranca, y el botón de ayuda relanza.

### Fase 2 · Contenido ✅

`data-tour` en los anclajes + pasos de las 5 pantallas + botón de ayuda +
auto-arranque. Decisiones al implementar:

- **Tono "para qué te sirve"**, con el qué implícito.
- **Un solo punto de cableado**: el sidebar persiste entre rutas, así que
  `AppSidebar` resuelve el tour por `pathname` (`tours.ts` en `app`) y renderiza
  tanto el `TourAutoStart` como el botón de ayuda. Las pantallas no se tocan
  salvo por los anclajes.
- Los guiones de detalle/análisis viven en `finance/tours.ts` (su UI es del
  módulo) y se exportan por `index.ts`; los de Inicio/Finanzas/Personas en
  `app/(app)/tours.ts`, porque esas pantallas se componen en `app`.
- **Wrapper `<div data-tour className="grid">`** alrededor de cards que son
  hijas de grid: ancla sin cambiar el stretch del item. Donde ya había un div
  propio (selector de mes, filtro de dueños), el atributo va directo.
- El botón de la píldora "Análisis" y el de "Agregar persona" se anclan directo:
  `Button` de shadcn hace spread de props, `data-tour` pasa.
- Verificado en navegador: los 5 pasos de Inicio anclan (dominante, fugas, nav,
  colapso, tema), "1 de 5", Listo marca visto. Un hallazgo: **el click en el
  overlay cierra el tour** (default de driver.js) — se dejó así, salir fácil
  vale más que forzar el recorrido.

Guion por pantalla:

| Pantalla | Pasos |
| --- | --- |
| Inicio | balance del hogar → fugas del mes → módulos del sidebar → colapso → tema → sesión |
| Finanzas | deuda total → calendario de pagos → utilización → lista de tarjetas |
| Detalle | deuda/saldo → selector de mes → orden por monto → top 5 → costo del crédito |
| Análisis | gasto del periodo → serie mensual → categorías → suscripciones → fugas |
| Personas | qué son (etiquetas, no permisos) → colores → alta |

### Fase 3 · Validación ✅

Verificado en navegador: teclado (Esc cierra, ←/→ navegan — driver escucha las
flechas en **keyup**, no keydown), riel colapsado (los anclajes del sidebar
existen en ambos estados y el recorte enmarca el riel limpio), reduced-motion
(`driver-simple` en el body cuando aplica), y ambos temas.

La auditoría numérica del `design-critic` (19 hallazgos) obligó a más que
retoques:

- **Focos heredados de driver.css** que ganaban por especificidad: el `×` en
  foco quedaba `#2d2d2d` sobre superficie oscura (1.18:1, invisible) y Atrás en
  foco `#f7f7f7` (1.36:1). driver enfoca el primer botón EN CADA PASO, así que
  no era un estado raro: era el estado normal. Cubiertos con overrides
  explícitos de `:focus`.
- **`--brand-700` roto en todo el tema oscuro**, no solo en el popover: era
  tinta del kicker y sustrato de `--brand-fill` a la vez, y `.dark` no lo
  redefinía (2.88:1). Se partió por uso — ver el SKIN.
- **El popover ahora lleva la firma**: título de card (13px/800, no kicker mono
  — una frase en versalitas mono pierde la forma de palabra) con la **regleta
  de ticks** debajo, y el primario saca su regleta en hover. Antes era "una
  card blanca con un botón azul que podría ser de cualquier app" — palabras del
  crítico.
- Overlay tokenizado (`--tour-overlay-*`): penumbra de marca en claro, negro en
  oscuro con separación por **borde** (`--tour-popover-line`).
- `duration: 240` (el `--dur-panel` del motor, no los 400ms de driver),
  `stageRadius: 18` (el recorte abraza el radio de card), progreso en
  `--ink-3` (el mut daba 4.08 sobre blanco), `×` reposicionado fuera de la
  curva del radio, y la cifra "80%" del guion en `.tnum`.
- **Bug propio encontrado al validar**: un `drive()` fallido (HMR a mitad de
  tour) dejaba el flag `active` puesto y el botón de ayuda moría hasta
  recargar. `try/catch` con reset.

Pendientes menores anotados, sin valor definido en DESIGN/SKIN: botón
deshabilitado con `opacity` heredada (WCAG lo exime), la flecha del popover sin
contorno, y 5 de 23 guiones sin remate de "para qué".

## Qué NO cubre

- Tours de flujos de escritura ("cómo registrar una tarjeta" paso a paso
  interactivo): otro tipo de feature (checklist), otro día.
- Sincronizar "visto" entre dispositivos: ver decisión de localStorage.

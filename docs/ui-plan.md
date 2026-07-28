# Plan · Colapso de sidebar, tema oscuro, textura y hover

> Cuatro pedidos que parecen independientes y no lo son: tres de los cuatro son
> decisiones de color, y el tema oscuro las condiciona a todas.

## Lo que se encontró antes de planear

**El toggle de tema ya existe y no hace nada.** `src/components/theme-toggle.tsx`
alterna la clase `dark` y cambia su propio texto entre "Tema oscuro" y "Tema
claro". Nada más pasa, por tres razones encadenadas:

1. **`@custom-variant dark` no está declarado.** En Tailwind v4 `dark:` significa
   `@media (prefers-color-scheme: dark)`, **no** la clase `.dark`. Todas las
   utilidades `dark:` del repo —incluidas las del propio toggle— obedecen al
   sistema operativo, no al botón.
2. **No hay bloque `.dark` en `globals.css`.** Cero tokens oscuros definidos.
3. **`ui/sonner.tsx` llama `useTheme()` de next-themes y no hay `ThemeProvider`.**
   Los toasts nunca siguen el tema.

Tampoco hay script anti-flash: aunque existieran los tokens, cada recarga daría
un destello claro antes de aplicar la preferencia guardada.

Conclusión: soportar el tema oscuro no es agregar un bloque de variables. Es
arreglar el mecanismo y **diseñar** un segundo tema.

---

## Fase A · Sidebar colapsable

Independiente de las otras tres. Se puede hacer de inmediato.

### La decisión que importa: cookie, no localStorage

`src/app/(app)/layout.tsx` es un Server Component. Con una cookie, el servidor
ya renderiza el ancho correcto en el primer paint. Con `localStorage` habría un
salto de 260px → 68px visible en **cada** navegación.

- Cookie `sidebar:collapsed`, leída con `cookies()` en el layout.
- El toggle vive en un Client Component que escribe la cookie y aplica el estado
  de forma optimista sobre el `<aside>`; sin round-trip al servidor.

### Alcance

- `--sidebar-w: 260px` + `--sidebar-w-rail: 68px`, transición con `--dur-panel`.
- Botón `PanelLeft` junto a "Admin Home", con `aria-expanded` y `aria-controls`.
- En riel: buscador → solo icono; etiquetas "Módulos" y "Próximamente" → ocultas;
  labels de nav → ocultos, con tooltip (el `TooltipProvider` ya está en el root
  layout); pie de sidebar → solo avatar.

### Conflicto conocido

`.m-bezel::before` (el dial detrás del avatar) está posicionado en
`left: 22px; width: 74px`. En un riel de 68px se desborda. Hay que suprimirlo o
recentrarlo en estado colapsado.

> `src/components/ui/sidebar.tsx` existe pero la app no lo usa: el `<aside>` está
> hecho a mano. Adoptarlo daría el colapso gratis a cambio de pelear con el
> diseño. Se mantiene a mano.

---

## Fase B · Tokenizar (cero cambio visual) ✅

Prerrequisito del tema oscuro. Los valores crudos que impedían invertir ya son
variables, con el mismo valor de antes:

| Token nuevo | Reemplaza |
| --- | --- |
| `--step-1..3` mezclan contra `var(--surface)` | el `#fff` literal |
| `--sh-rgb`, `--sh-brand-rgb`, `--edge-top` | los `rgb(30 45 80)` y el `#fff` del filo dentro de `--sh-*` |
| `--trend-a`, `--trend-b`, `--trend-line` | los tres hex de `.m-trend` |
| `--brand-specular` | el `rgb(255 255 255 / .28)` de `.m-brand::before` |
| `--tex-grain-filter/-blend/-opacity` | el `invert(1)` + `multiply` + `.35` de `body::before` |
| `--tex-brand-blend/-opacity` | el `soft-light` + `.28` de `.m-brand::after` |

Se dejaron crudos a propósito los valores de superficies que **siempre** son
oscuras (`--sh-dark`, `--hatch-dark`, el filo de `--sh-brand`) y los `#000` de
las `mask-image`, que son alfa y no color.

**Verificación:** se comparó el estilo computado de los 5 materiales, los 3
escalones, el hatch, la regleta y el `body` —30 nodos × 8 propiedades— antes y
después. Idéntico salvo una diferencia de serialización (`at 100% 0px` →
`at 100% 0%`), que es la misma posición.

### Lo que el barrido dejó listo para la Fase C

En los componentes **no hay un solo hex hardcodeado**. Todos los `text-white` y
`bg-white` viven sobre superficies que siguen siendo oscuras en tema oscuro
(`.m-dark`, `.m-brand`, la píldora activa del nav), así que no se tocan.

La excepción, y es un ítem real de C3: **`bg-ink text-white`** en el chip
`dark` de `blueprint.tsx` y en el selector de mes de `card-detail.tsx`. En tema
oscuro `--ink` se aclara, así que eso queda blanco sobre claro.

---

## Fase C · Motor de tema oscuro ✅

Documentado en `DESIGN.md` §9 (lo portable) y en el SKIN (lo del proyecto).

**Lo que no se anticipó y salió al comparar los dos temas lado a lado:** con los
mismos porcentajes, los **escalones tonales se aplanan**. Restarle luz al blanco
se percibe mucho más que sumársela al negro, así que la secuencia 8/14/20 deja
de leerse como escalera. Suben a 14/24/34 para igualar el salto percibido. Por
la misma razón hubo que empujar más lejos la card oscura y el lavado de
tendencia: en oscuro las diferencias chicas de luminancia no se ven.

### C1 · Mecanismo

- Declarar `@custom-variant dark (&:where(.dark, .dark *));`. Esto solo ya
  arregla todos los `dark:` que shadcn ya trae escritos.
- Adoptar **next-themes** (ya está en `package.json`, hoy sin proveedor):
  `ThemeProvider` con `attribute="class"`, `defaultTheme="system"` y
  `disableTransitionOnChange`. Resuelve persistencia, preferencia del sistema y
  el flash de una vez, y de paso arregla los toasts.
- `suppressHydrationWarning` en `<html>`.
- Reescribir `ThemeToggle` sobre `useTheme()`.

### C2 · Tokens que sí son un flip

`--ink*`, `--line*`, `--surface`, `--canvas-*`, `--sidebar*`. Mecánico.

### C3 · Lo que NO invierte — aquí está el diseño de verdad

Cinco piezas de la identidad dejan de funcionar sobre lienzo oscuro. Cada una
necesita una decisión, no una variable:

1. **`.m-dark` (la card de fugas).** Su fuerza es ser lo más oscuro de una
   página clara. Sobre canvas oscuro se desvanece y pierde el papel de alerta.
   Necesita otro diferenciador: superficie *más clara* que el canvas, o tinte de
   marca.
2. **`.m-brand` (la dominante).** Cian saturado con texto blanco sobre fondo
   oscuro vibra. Hay que bajar la luminancia del gradiente.
3. **`--cat-1..6`.** La rampa está ordenada "mayor monto = más oscuro". En dark
   eso vuelve la rebanada más grande la menos visible. **Se invierte la
   dirección de la rampa.**
4. **Sombras.** `--sh-*` son azul oscuro: sobre negro no existen. En dark la
   elevación se hace con superficie más clara + hairline superior, no con sombra.
5. **`--danger`.** `#D92D20` no pasa contraste sobre oscuro. `--danger-on-dark`
   (`#FF6B5E`) ya existe para la card oscura y pasa a ser el danger primario.

### C4 · Texturas

`body::before` invierte el asset y usa `multiply`, que sobre oscuro solo apaga.
En dark: sin `invert` y con `screen`. Lo mismo aplica a `.m-brand::after`
(soft-light) y a `.m-bezel` (screen).

### C5 · Documentar en DESIGN.md y el SKIN

Sin esto el subagente `design-critic` no tiene contra qué validar, y es la
herramienta que existe para que el diseño no se degrade. Una sección de modo
oscuro con la tabla de qué invierte y qué se rediseña.

### C6 · Validar

Playwright + `design-critic` sobre las 4 pantallas, en ambos temas.

---

## Fase D · Textura de puntos en el área de contenido

> Asumido: "la parte que carga los módulos" = el `<main>` donde se renderizan las
> páginas, no la sección "Módulos" del sidebar.

**Sin asset nuevo.** Un `radial-gradient` de 1px cada ~22px tesela perfecto,
pesa cero bytes, se ve nítido en cualquier densidad de pantalla y **cambia de
color con el tema solo** — un `.avif` no. Los tres assets existentes (grano,
topografía, dial) son texturas irregulares; una retícula es geometría pura y el
CSS la hace mejor que una imagen.

**Conflicto**: `body::before` ya cubre todo con grano al 35%. Encimar dos
texturas es justo lo que el `design-critic` marcó en la iteración anterior.
Decisión a tomar: los puntos **reemplazan** el grano dentro de `<main>` (el
grano se queda en sidebar y bordes), o el grano baja a ~20% donde hay puntos.

Opacidad objetivo 4–6%, con máscara radial para que no sea un patrón plano de
pared a pared.

---

## Fase E · Hover característico

### Dónde se implementa

**No se toca `src/components/ui/button.tsx`**: lo genera el CLI y AGENTS.md
prohíbe editarlo a mano. No hace falta — `Button` ya emite `data-slot="button"`
y `data-variant`, así que el estilo se escribe en `globals.css` contra
`[data-slot="button"][data-variant="…"]:hover` y aplica en toda la app sin tocar
el archivo generado.

### Qué se siente

El elemento firma del proyecto es la **regleta de ticks**. Propuesta: el hover
levanta el botón 1px, enciende un hairline interior superior y un halo de marca;
en la variante `default` además barre una regleta de ticks por el borde inferior.
Combinado con el `active:translate-y-px` que ya existe, se lee como un switch de
panel que se asienta al presionarlo.

### Alcance

- Cubrir también lo que no es `<Button>`: links del nav, `ThemeToggle` y la caja
  de búsqueda, con una utilidad compartida.
- Equivalente en `focus-visible`: un efecto solo-hover deja fuera al teclado.
- `@media (prefers-reduced-motion: reduce)` sin desplazamiento.

---

## Orden recomendado

```
A  →  B  →  C  →  (D + E)
```

D y E son decisiones de color y movimiento: hechas antes del tema oscuro, se
hacen dos veces. A es independiente y puede arrancar ya.

Si se prefiere ver algo rápido, la alternativa es **A + E en claro primero**,
asumiendo un retoque cuando entre el dark.

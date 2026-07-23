**Nunca un radio hijo ≥ al del padre.** Nunca esquinas duras salvo
dentro de `overflow:hidden`.

### Gaps
Grid principal `16px` · Stat strip `14px` · Toolbar `10–12px` ·
Interno de card (label↔dato) `10–14px`.

### Sidebar
Ancho fijo `260px`. Superficie propia distinta del canvas. Logo →
search → nav agrupada por secciones → `margin-top:auto` → card
oscura o de marca al pie (tipo 3) para romper verticalidad.

### Canvas
Lavado ambiental sobre TODO el fondo, no solo dentro de cards:
gradiente diagonal muy diluido (≤14% alpha) + radial de marca en
una esquina, como luz entrando a un panel físico.

### Densidad — la regla que más se rompe
- **Alto de fila fijo**: nunca `height:auto` en filas de datos.
  Dashboard ~37px, listado dedicado ~46px.
- **Truncado**, no wrap: `overflow:hidden; text-overflow:ellipsis;
  white-space:nowrap` dentro de columna `minmax(0,Nfr)`.
- **Filas visibles mínimas**: 8 en dashboard, 12–14 en listado
  dedicado.
- **Prohibido estirar contenido con espacio vacío**: el contenido
  define el alto de cards de lista. Si sobra espacio, se suben
  filas (6-8+), nunca se reparte con `space-between` entre pocas.
- Footer de tabla siempre presente: resumen + total/paginación.
- **Densidad es paramétrica según el perfil de uso** — un power
  user de sesiones largas (ERP, ops) pide más densidad y menos
  aire que un dashboard de consumo casual (fintech personal,
  fitness). Documentar el perfil en el SKIN de cada proyecto.

---

## 5 · Motor de textura

### Única textura del sistema: rayado diagonal
```css
background: repeating-linear-gradient(45deg, <color> 0 3px, transparent 3px 6px);
```

| Contexto | Ángulo | Barra/gap | Uso |
|---|---|---|---|
| Dato proyectado / pasado | 45° | 3px/3px | sobre hero o par tonal |
| Porción no cubierta de barra | 45° | 3px/3px | tinte neutro |
| Chip de estado vacío/sin dato | 45° | 3px/3px | tinte neutro, texto atenuado |
| Overlay de card oscura (grano) | 45° | 1px/8px | blanco 3% |
| Estado vacío (icono/borde) | 45° | 4px/9px | tinte del acento |

**Cuándo sí**: inactivo, sin dato, agotado, proyección/pasado,
grano sutil en oscuras.
**Cuándo no**: nunca sobre dato activo/presente (va relleno
sólido), nunca decorativo en card clara, nunca dos densidades
distintas en el mismo elemento.

---

## 6 · Motor de componentes

**KPI card**: chip de icono 28×28 (r-el-sm, tinte de matiz) + label
uppercase 11/700 muted → dato grande en peso 800 → fila de delta
(chip) + descripción muted.

**Chip de estado**: pill, `padding:5px 9px`, font 700/9px + icono
9px. Variantes: activo (relleno de marca), neutro (borde),
rayado (sin dato), estado (`danger`/`warn` sobre tinte).

**Chip de delta**: pill, `padding:3px 7px`, font 800/10px + flecha.
Positivo `ok` sobre tinte. Negativo `danger` sobre tinte. Sobre
card dominante: invertido a blanco. Nunca texto suelto sin pastilla.

**Barra de progreso**: `height:6-7px`, radius completo siempre.
Pista sólida si el vacío es "espacio real"; rayada si es "faltante".

**Tabla de datos**: columnas fijas con `minmax(0,Nfr)`. Header con
micro-label mono uppercase. Filas alto fijo, borde inferior sutil,
última sin borde. Cifras `.tnum` alineadas a la derecha. Footer
con resumen + paginación.

**Item de lista con barra**: label + valor `.tnum` a la derecha →
barra debajo. El contenido define el alto.

**Card de alerta**: tipo 3 o 2. Icono en chip → título → dato
grande → descripción → CTA pill con sombra de marca.

**Paginación**: botones cuadrados r-el-sm. Activo relleno de
marca con sombra. Inactivo con borde.

---

## 7 · Motor de movimiento

Sobrio y funcional, nunca decorativo.

| Token | Valor |
|---|---|
| Easing estándar | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Easing entrada | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Duración micro | 120ms |
| Duración estándar | 180ms |
| Duración panel/overlay | 240ms |

**Se anima**: filas en hover (background), items de nav, botones/
chips-acción (elevación + `translateY(-1px)`), brillo de CTAs.
**Nunca se anima**: layout del bento, tamaño de datos, texturas.

---

## 8 · Elemento firma (tu método, se adapta por proyecto)

Cada proyecto debe tener 2-3 gestos que no existirían en otra app,
construidos con las mismas piezas de este motor:

1. La card dominante con dato vivo en blanco sólido sobre el resto
   atenuado — "esto es lo que importa ahora" señalado por contraste,
   no por texto.
2. El lavado de marca entrando por una esquina del canvas, no
   dentro de cards — luz de ambiente, no de superficie.
3. La secuencia de escalones tonales leída como módulos calibrados
   en fila, no como cards iguales repetidas.
4. El rayado 45° 3px/3px como único lenguaje de "ausencia" en todo
   el sistema — consistente en barras, chips y overlays.

---

## Prohibiciones globales

- ❌ Cards uniformes del mismo tamaño/material (grid de N iguales).
- ❌ Radius ~12px con iconos multicolor en cuadraditos.
- ❌ Marca usada como error, o error usado como énfasis.
- ❌ Acento en filetes/píldoras delgadas en vez de área rellena
  en la dominante.
- ❌ Cifras sin `tabular-nums` en columna.
- ❌ Filas de alto variable / con wrap.
- ❌ `space-between` para llenar espacio vacío en vez de subir filas.
- ❌ Texturas fuera del rayado 45° definido. Sombras planas de
  una sola capa.
- ❌ Más de una dominante, o dominante y oscura adyacentes.
- ❌ Inter/Roboto/system-ui como display. Emoji como iconografía.
- ❌ Animar el layout del bento.

---

## `globals.css` — scaffold portable

```css
:root {
  /* — Marca (definir hex en SKIN del proyecto) — */
  --brand:        var(--skin-brand);
  --brand-600:    var(--skin-brand-600);
  --brand-700:    var(--skin-brand-700);
  --brand-900:    var(--skin-brand-900);
  --brand-050:    var(--skin-brand-050);
  --brand-100:    var(--skin-brand-100);
  --brand-fg:     #ffffff;

  /* — Estado (hue SEPARADO del de marca — ver regla de separación) — */
  --ok:      #128a4a;  --ok-050:     #e2f5ea;
  --danger:  var(--skin-danger); /* NO cercano a --brand */
  --danger-050: var(--skin-danger-050);
  --warn:    #b5771b;  --warn-050:   #fbf0da;

  /* — Neutros (temperatura definida en SKIN) — */
  --ink:      var(--skin-ink);
  --ink-2:    var(--skin-ink-2);
  --ink-3:    var(--skin-ink-3);
  --muted:    var(--skin-muted);
  --muted-2:  var(--skin-muted-2);
  --line:     var(--skin-line);
  --line-2:   var(--skin-line-2);
  --surface:  #ffffff;
  --sidebar:  var(--skin-sidebar);
  --sidebar-border: var(--skin-sidebar-border);
  --canvas-a: var(--skin-canvas-a);
  --canvas-b: var(--skin-canvas-b);
  --dark-a:   var(--skin-dark-a);
  --dark-b:   var(--skin-dark-b);
  --dark-fg:  var(--skin-dark-fg);

  /* — Tipografía (familias en SKIN) — */
  --font-sans: var(--skin-font-sans);
  --font-mono: var(--skin-font-mono);

  /* — Radios anidados (fijo, portable) — */
  --r-shell: 24px; --r-card: 18px; --r-card-sm: 16px;
  --r-el: 12px; --r-el-sm: 9px; --r-pill: 999px;

  /* — Espaciado (fijo, portable) — */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px;
  --sp-5:20px; --sp-6:24px; --gap-bento:16px; --gap-strip:14px;

  /* — Elevación (fijo, portable) — */
  --sh-base:  0 1px 2px rgba(30,45,80,.05), 0 8px 20px rgba(30,45,80,.06);
  --sh-raise: 0 1px 2px rgba(30,45,80,.08), 0 12px 30px rgba(30,45,80,.12), 0 30px 60px rgba(30,45,80,.08), inset 0 1px 0 #fff;
  --sh-brand: 0 2px 4px rgba(0,0,0,.35), 0 16px 36px rgba(0,0,0,.4), 0 36px 70px rgba(0,0,0,.26), inset 0 1px 0 #ffffff33;
  --sh-dark:  0 2px 4px rgba(16,21,31,.3), 0 12px 28px rgba(16,21,31,.34), inset 0 1px 0 #ffffff14;

  /* — Superficies compuestas (gradientes de SKIN) — */
  --grad-brand:  var(--skin-grad-brand);
  --grad-dark:   linear-gradient(150deg, var(--dark-a), var(--dark-b));
  --canvas-wash: linear-gradient(135deg, var(--canvas-a) 0%, var(--canvas-b) 52%),
                 radial-gradient(85% 80% at 100% -5%, var(--skin-glow), transparent 58%);
  --hatch:       repeating-linear-gradient(45deg, var(--line-2) 0 3px, var(--line) 3px 6px);
  --hatch-dark:  repeating-linear-gradient(45deg, #ffffff08 0 1px, transparent 1px 8px);

  /* — Sidebar (fijo, portable) — */
  --sidebar-w: 260px;

  /* — Densidad (ajustar por perfil de uso en SKIN) — */
  --row-h:    46px;
  --row-h-sm: 37px;

  /* — Movimiento (fijo, portable) — */
  --ease:      cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:   cubic-bezier(0.16, 1, 0.3, 1);
  --dur-micro: 120ms;
  --dur:       180ms;
  --dur-panel: 240ms;
}

.tnum { font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
.nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
```

---

## Plantilla `SKIN-[proyecto].md` — llenar por cada nuevo proyecto

```markdown
# SKIN — [Nombre del proyecto]
> Hereda de BRAND-SYSTEM.md v1.0. Solo define lo que cambia.

## Tesis del proyecto
[Una frase: qué es, qué NO es, referencia física con luz]

## Perfil de uso (define densidad)
[Power user de sesiones largas / uso casual — ajusta --row-h,
aire, filas visibles]

## Paleta
--skin-brand: #______
--skin-danger: #______  (verificar separación de hue vs. brand)
[resto de escalas]

## Tipografía
Display: ______
Mono: ______

## Matices de dato
[2-4 hues con su rol semántico específico del dominio]

## Elemento firma específico
[Cómo se manifiesta el patrón general del motor en este proyecto]
```

---


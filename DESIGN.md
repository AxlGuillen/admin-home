# Axl — Sistema de Dashboards Densos
> v1.0 · Motor portable de diseño para paneles de datos con acabado de instrumento.

Este documento define el MÉTODO, no el proyecto. Los tokens de
color, tipografía y la tesis van en un archivo separado
`SKIN-[proyecto].md` que hereda de este.

---

## Principio rector

Un dashboard denso se comporta como **instrumento físico con luz**,
no como hoja impresa ni como shot de Dribbble optimizado para verse
bien en miniatura. Prioriza:

- Densidad de power user sobre aire decorativo.
- Superficies con volumen real (luz, sombra en capas) sobre planitud.
- Color como comunicación (marca o estado), nunca como relleno
  decorativo.
- Datos numéricos tratados con rigor de tablero: alineados,
  tabulares, comparables en columna.

**NO es**: papel/imprenta, dashboard de cards uniformes con iconos
multicolor en cuadraditos, SaaS-shot con foto de stock y 40% de aire.

---

## 1 · Motor tipográfico (patrón, no fuentes fijas)

### Regla
Siempre **dos o tres familias**, nunca una sola:
- **Display/texto**: una sans geométrica o humanista con peso 800
  disponible para datos hero.
- **Mono/dato**: una monoespaciada para todo lo numérico, técnico
  o que vive en columna.
- (Opcional) una serif o display alternativa solo si la tesis del
  proyecto lo pide — no por defecto.

Nunca Inter/Roboto/system-ui como fuente de display. El par debe
elegirse a propósito por proyecto (ver SKIN).

### Escala por rol — proporciones fijas, tamaños ajustables ±10%

| Rol | Size ref | Weight | Line-height | Tracking | Familia |
|---|---|---|---|---|---|
| Dato hero | 30px | 800 | 1 | -0.02em | Display |
| Título de pantalla | 25px | 800 | 1 | -0.025em | Display |
| Dato KPI grande | 34px | 800 | 1 | -0.03em | Display |
| Dato medio (stat strip) | 22px | 800 | 1 | normal | Display |
| Título de card | 13px | 800 | 1 | normal | Display |
| Subtítulo / valor 2° | 12px | 700 | 1 | normal | Display |
| Label de sección | 11px | 700 | 1 | 0.04em UPPER | Display |
| Label técnica / eyebrow | 11px | 600–700 | 1 | 0.04–0.06em UPPER | Mono |
| Body / fila de tabla | 12px | 600 | 1 | normal | Display |
| Body secundario | 11.5px | 500 | 1 | normal | Display |
| Dato numérico en tabla | 12px | 400–700 | 1 | normal | **Mono** |
| Caption / meta | 11px | 400 | 1 | normal | Mono |
| Micro-label (header col) | 9px | 700 | 1 | 0.04em UPPER | Mono |
| Chip de estado/delta | 9–10px | 700–800 | 1 | normal | Display |

### Regla de numerales tabulares (no negociable)
Todo dígito comparado o escaneado en columna: `font-variant-numeric:
tabular-nums` + familia mono. Aplica a montos, folios/SKU, fechas,
%, conteos, precios, paginación. Nunca proporcional para una cifra
que vive en columna o cambia en runtime.

```css
.tnum { font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
```

---

## 2 · Motor de color (estructura — hex se define en SKIN)

### Tres capas obligatorias, nunca mezcladas

**Marca** — identidad, NUNCA estado. Un solo hue. Escalas
`-900/-700/-600/base/-100/-050` para gradientes y tintes.

**Datos secundarios** — variedad de matiz para clasificar tipos de
dato en el bento (2-4 hues distintos de baja saturación). NO
comunican estado ni marca; cada matiz identifica consistentemente
la misma familia de dato en todo el sitio.

**Estado** — semántica funcional pura: `ok` (positivo), `danger`
(negativo/crítico), `warn` (atención), `empty` (rayado, ver Textura).
Estos NUNCA decoran.

### Regla de separación de hue (crítica)
El hue de marca y el hue de `danger` deben estar **claramente
distanciados** (mínimo ~40° en el círculo de color, o familia de
color distinta por completo). Si marca es roja, `danger` no puede
ser un rojo cercano — usa naranja-rojo, o cambia la marca de hue
para ese proyecto. Confundir marca con alerta es el error más caro
del sistema.

### Reglas de peso
- El acento de marca ocupa **20–25% de la pantalla**, concentrado
  en UNA card dominante rellena + nav activa + acciones primarias.
  Ni menos (pierde energía) ni repartido en filetes.
- Marca se usa como **área rellena**, nunca como borde delgado ni
  píldora decorativa fina.
- Matices de dato son de bajo peso: tintes de fondo y barras, nunca
  compiten con marca por jerarquía.

### Prohibiciones de color
- ❌ Marca para delta positivo → eso es `ok`.
- ❌ Marca para error/negativo → eso es `danger`.
- ❌ `ok` para algo que no sea resultado positivo real.
- ❌ Matiz de dato como color de estado o acción.
- ❌ Color decorativo en una card que no sea dominante o escalón
  declarado.
- ❌ Gradientes morados/azules genéricos por defecto — el hue lo
  decide la tesis del proyecto, no la costumbre.

### Neutros — temperatura, nunca grises muertos
Los neutros deben tener un sesgo de temperatura sutil (frío hacia
el hue de marca, o cálido, según la tesis) — nunca grises puros
`#888` sin matiz.

---

## 3 · Motor de material — jerarquía de 5 superficies

**Mínimo 4 de los 5 tipos conviven en cada pantalla densa.**

### Tipo 1 · Card base neutra (la mayoría)
KPIs estándar, tabla, tiles de lista.
```css
background: var(--surface);
border: 1px solid var(--line);
border-radius: var(--r-card);
box-shadow: var(--sh-base);
```

### Tipo 2 · Card dominante rellena de marca (EXACTAMENTE UNA por pantalla)
La métrica que define la pantalla. Texto invertido, ocupa columna
a doble alto. Carga la energía visual.
```css
background: var(--grad-brand);
border-radius: var(--r-card);
box-shadow: var(--sh-brand);
color: #fff;
```
Internos: halo radial en una esquina. **Alto contraste interno
obligatorio**: dato/serie activa en blanco sólido con glow, resto
en marca oscura — nunca dos tonos claros compitiendo.

### Tipo 3 · Card oscura de contraste (máximo UNA-DOS, si dos no adyacentes)
Alerta, stat crítico, o pie de sidebar. Rompe la verticalidad.
```css
background: var(--grad-dark);
border-radius: var(--r-card-sm);
box-shadow: var(--sh-dark);
color: var(--dark-fg);
```
Overlay de rayado sutil obligatorio (ver Textura, blanco 3% sobre
oscuro).

### Tipo 4 · Card con tratamiento diferenciado
Gráfica a sangre / gradiente interno perceptible. Tendencia, flujo.
```css
background: linear-gradient(160deg, [tinte-a], [tinte-b]);
border: 1px solid [borde-tinte];
border-radius: var(--r-card);
overflow: hidden;
```
SVG de gráfica pegado al fondo, área rellena a baja opacidad.

### Tipo 5 · Card de escalón tonal (tinte de marca en pasos)
Evita el salto blanco→marca sin transición. Secuencia 8% → 20%,
nunca salpicados fuera de orden.

### Reglas de convivencia
- Exactamente **1** dominante (tipo 2). Dos compiten y anulan la
  jerarquía.
- Máximo **1-2** oscuras (tipo 3); si hay dos, no adyacentes.
- Dominante y oscura **nunca comparten borde** — necesitan una
  base o escalón entre ellas.
- Escalones (5) van en secuencia tonal entre base y dominante, no
  dispersos.

---

## 4 · Motor de espaciado y layout

### Escala base 4px
`4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 26`

### Radios anidados — regla estricta de contención

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

## 9 · Motor de tema oscuro

El tema oscuro **no es el claro invertido**. La mayoría de los tokens sí son un
flip mecánico —tintas, líneas, superficies, lienzo—, pero cinco piezas del motor
dejan de cumplir su función y cambian de **estrategia**, no de valor. Si se
invierten sin más, el sistema sigue siendo legible y deja de tener identidad.

### Lo que cambia de estrategia

| Pieza | Por qué se rompe | Qué se hace |
| --- | --- | --- |
| **Tipo 3 · card oscura** | Su fuerza era ser el máximo contraste contra una página clara. Sobre lienzo oscuro se desvanece y pierde el papel de gravedad. | Se invierte la dirección del contraste: pasa a ser un panel **más claro** que el lienzo, con filo superior propio. Sigue siendo el material más separado de la pantalla. |
| **Tipo 2 · card de marca** | Un acento saturado con texto blanco vibra sobre fondo oscuro. | Baja la luminancia del gradiente y se atenúa el especular. |
| **Rampa categórica** | Si está ordenada "mayor valor = más oscuro", sobre lienzo oscuro la categoría más grande queda invisible. | Se **invierte la dirección** de la rampa. La regla real no es "más oscuro", es "más contraste contra el fondo". |
| **Rayado de ausencia** | Los tokens de línea, más oscuros que la superficie en claro, quedan más claros que ella en oscuro: el vacío brilla más que el dato. | Las bandas bajan a nivel de lienzo para que el rayado siga **hundiéndose**. |
| **Elevación** | Una sombra tintada no existe sobre negro. | La elevación se comunica con el **filo interior superior** y con una superficie más clara; la sombra solo acompaña. |
| **Texturas** | `multiply` sobre un fondo oscuro solo apaga. Un asset invertido para papel blanco no sirve. | Se cambia el `blend-mode` a `screen` y se quita el `filter`. El asset es el mismo. |

### El techo que nadie ve venir

En tema claro los materiales tienen **todo el rango** para separarse: el lienzo
está arriba del todo y la card oscura puede irse hasta abajo. En oscuro ese
margen no existe — el lienzo ya está en el piso y todos los materiales se
apiñan en una banda estrecha. Consecuencias:

- **La card oscura no puede subir cuanto quiera.** Su cifra clave suele ser roja,
  y un rojo de estado deja de pasar 4.5:1 en cuanto el panel se aclara. Sube lo
  justo y el resto de su identidad lo cargan el **rayado y el filo**, que ningún
  otro material tiene. Si se elige entre legibilidad y jerarquía, gana la
  legibilidad: una cifra ilegible es un fallo funcional, una jerarquía floja es
  estético.
- **Fija un ΔL\* mínimo entre materiales antes de elegir valores.** Sin ese
  número es facilísimo que dos materiales aterricen en la misma luminancia y
  nadie lo note hasta medirlo.

### Lo que casi nadie recuerda

- **Los escalones tonales NO necesitan otra receta.** Es tentador subirles el
  porcentaje porque "sobre negro se aplanan", pero es falso: a igual porcentaje,
  mezclar marca sobre una superficie oscura da un ΔL\* **mayor** que sobre
  blanco. Si en pantalla se ven planos, sospecha de la captura antes que del
  valor — una imagen reducida aplasta las diferencias oscuro-sobre-oscuro.
  **Mide, no mires.**
- **El rayado también cambia de estrategia.** Es el lenguaje de la ausencia, así
  que tiene que **hundirse** respecto a la card. Los tokens de línea, que en
  claro son más oscuros que la superficie, en oscuro son más claros: usados tal
  cual, el vacío acaba brillando más que el dato.
- **Un token de tinta no es un token de relleno.** El más oscuro del tema claro
  se vuelve el más claro del oscuro: como texto está bien, como fondo se
  convierte en el área más brillante de la pantalla y le gana a la dominante.
- **El rojo de estado del tema claro no pasa contraste sobre oscuro.** El rojo
  que el skin ya definió para la card oscura pasa a ser el primario.
- **El lavado de marca más claro es una superficie, no una tinta.** Si un token
  de la rampa se usa como fondo, se invierte; si se usa como tinta sobre una
  superficie que sigue siendo oscura, **no**. Hay que revisar el uso real, no el
  nombre del token.
- **Las utilidades `dark:` no se activan solas.** En Tailwind v4 `dark:`
  significa `prefers-color-scheme`; para que obedezcan a una clase hay que
  declarar `@custom-variant dark (&:where(.dark, .dark *))`.

### Requisito de tokenización

Todo esto solo es posible si el tema claro no tiene valores crudos dentro de las
reglas. Antes de escribir el bloque oscuro, deben ser variables: el color de la
sombra y el filo, el sustrato contra el que mezclan los escalones, los colores
de la card de tendencia, el especular, y **el `blend-mode`, el `filter` y la
opacidad de cada textura**.

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


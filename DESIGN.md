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
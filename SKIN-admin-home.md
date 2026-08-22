# SKIN — Admin Home
> Hereda de `DESIGN.md` v1.0. Solo define lo que cambia.
> Radios, espaciado, elevación, movimiento y densidad base son **portables**: no se tocan aquí.

## Tesis del proyecto

**Un tablero de instrumentos de precisión para la casa.**

La casa es una máquina que consume dinero; este panel es el medidor
empotrado que la lee. Referencia física con luz: el **bisel de un
termostato de precisión** — cristal claro, cifras nítidas, y una luz
cian que se enciende por detrás donde hay actividad.

**NO es**: app de finanzas personales con ilustraciones, ni tarjetas
uniformes con iconitos de colores, ni panel oscuro "tipo cripto".

Consecuencias:
- La luz **sale de adentro** de la superficie (halo radial, glow en el
  dato activo), nunca es un drop-shadow decorativo encima.
- Cada cifra es una **lectura**, no un texto: mono + tabular, alineada.
- El cian marca **lo que está vivo**; el rojo marca **fuga de capital**.
  Nunca se tocan ni se sustituyen.

## Perfil de uso (define densidad)

**Power user de sesiones largas.** El uso real es análisis retrospectivo:
14 tarjetas, 90 estados de cuenta, ~2,000 movimientos. Se escanea en
columna y se compara mes contra mes.

- Listas y tiles: `--row-h` (46px) sin cambios.
- **Tablas de movimientos: `--row-h-sm` (37px)** — se buscan ≥14 filas
  visibles sin scroll. Nada de aire decorativo entre filas.
- Truncado con `.nm`, nunca wrap en fila de tabla.

## Paleta

```css
/* — Marca · cian de instrumento, hue ≈ 196° — */
--skin-brand:      #0A9FD4;
--skin-brand-600:  #0888B6;
--skin-brand-700:  #076F96;
--skin-brand-900:  #06364A;
--skin-brand-100:  #BCE6F7;
--skin-brand-050:  #E8F6FC;
--skin-grad-brand: linear-gradient(150deg, #12B0E4 0%, #0A9FD4 46%, #076F96 100%);
--skin-glow:       rgba(10, 159, 212, .12);

/* — Estado · danger (ok y warn son fijos del motor) — */
--skin-danger:     #D92D20;   /* hue ≈ 4° */
--skin-danger-050: #FDECEA;

/* — Neutros · sesgo frío hacia la marca, ningún gris muerto — */
--skin-ink:            #0E1A22;
--skin-ink-2:          #24363F;
--skin-ink-3:          #3D525C;
--skin-muted:          #6B818C;
--skin-muted-2:        #93A6AF;
--skin-line:           #E1E9ED;
--skin-line-2:         #F0F5F7;
--skin-sidebar:        #F4F8FA;
--skin-sidebar-border: #E1E9ED;
--skin-canvas-a:       #F8FBFC;
--skin-canvas-b:       #EDF3F6;

/* — Card oscura (tipo 3) · el bisel del instrumento — */
--skin-dark-a:  #16242E;
--skin-dark-b:  #0D1720;
--skin-dark-fg: #C9DAE3;
```

### Verificación de separación de hue

| Par | Distancia | Veredicto |
|---|---|---|
| `brand` 196° ↔ `danger` 4° | **168°** | ✅ imposible confundir activo con fuga |
| `brand` 196° ↔ `ok` 148° | **48°** | ✅ supera el mínimo de ~40° |
| `brand` 196° ↔ `warn` 36° | **160°** | ✅ |

El cian se eligió a 196° (no a 187°) precisamente para abrir la distancia
contra el `ok` verde fijo del motor: a 187° quedaban a 39°, por debajo del
mínimo.

## Tipografía

**Display: `Archivo`** — grotesca técnica con 800 real para datos hero.
No es Inter, Roboto ni system-ui.
**Mono: `JetBrains Mono`** — numerales tabulares nítidos, lectura de display.

```css
--skin-font-sans: "Archivo", sans-serif;
--skin-font-mono: "JetBrains Mono", ui-monospace, monospace;
```

Toda cifra en columna lleva `.tnum`, sin excepción: montos, `%`, conteos,
fechas, últimos 4 dígitos.

## Matices de dato

Tres hues de baja saturación. Clasifican **familia de dato**, nunca
estado ni marca. Cada uno identifica siempre lo mismo en todo el sitio.

```css
--d-credito:  #6E7FC9;  /* hue 229° — tarjetas de crédito */
--d-debito:   #7E9660;  /* hue  87° — efectivo / cuentas de débito */
--d-suscrip:  #9A7AA0;  /* hue 290° — suscripciones recurrentes */
```

Las **transferencias** no llevan matiz: usan `--muted`. Mueven dinero, no
lo gastan, y no deben competir en el bento.

### Escala categórica de gasto (donut/legend)

Las categorías de gasto (súper, restaurante, salud…) NO usan los matices de
familia ni la marca — serían un arcoíris genérico. Usan una **rampa de acero
fría de un solo eje**, aplicada **ordenada por monto** (la categoría mayor toma
el tono más oscuro). Baja croma, no toca `--brand` ni estado.

```css
--cat-1: #2B4048;  --cat-2: #3C5A67;  --cat-3: #517483;
--cat-4: #6B8F9C;  --cat-5: #8FA9B3;  --cat-6: #B4C6CD;
```

> Se descartó un cuarto matiz terracota/arena: caía a ~20–45°, encima de
> `danger` (4°) y `warn` (36°). Tres hues bien separados > cuatro que
> mienten sobre el estado.

## Umbrales de estado

El motor define la semántica (`ok`/`danger`/`warn`) pero no cuándo dispara.
Para este dominio:

| Señal | Umbral | Color |
|---|---|---|
| Utilización de una tarjeta | `< 80%` | `--brand` (vivo, sano) |
| Utilización de una tarjeta | `>= 80%` | `--danger` (fuga inminente) |
| Utilización de una tarjeta | `>= 100%` | `--danger` + chip de sobregiro |

**80% es el único umbral del sistema.** Antes convivían dos (el gauge
disparaba a 80 y las barras a 100): una tarjeta al 96% se pintaba de marca,
que es exactamente lo que el motor prohíbe ("marca para negativo → eso es
`danger`").

## Política de cifra

Una sola regla, para que el mismo dato no aparezca en dos formatos:

| Rol | Formato | Ejemplo |
|---|---|---|
| Dato hero (dominante) | sin centavos | `$457,320` |
| Dato KPI grande | sin centavos | `$139,204` |
| Dato clave de card oscura | sin centavos | `$16,048` |
| Fila de tabla / detalle / leyenda | **con** centavos | `$9,865.00` |
| Footer de resumen | con centavos | `$139,204.00` |

El hero resume, la fila rinde cuentas. Toda cifra —también dentro de chips,
hints y frases— lleva `.tnum`; se envuelve **solo el número**, no la oración.

## Serie temporal: qué barra lleva la marca

El cian significa "vivo", así que en una serie por mes **lo lleva el mes en
curso**, no el máximo histórico. El mes en curso además va rayado 45° por ser
dato incompleto: se combinan, no se excluyen (`--brand` como color del rayado).
Los meses cerrados van en `--ink-3`. El máximo se señala con chip de valor,
nunca con color de marca — pintar de cian el peor mes cerrado contradice la
tesis.

## Orden de capas del canvas

El lavado de marca va **encima** del grano. El grano ensucia el lienzo; el
lavado es luz de ambiente y debe leerse por encima o la esquina se apaga en vez
de encenderse.

## Rojo sobre superficie oscura

`--danger` (#D92D20) sobre `--dark-a` da 3.5:1 — insuficiente a 12px. La
card oscura usa un escalón aclarado, y **uno solo** para toda la card:

```css
--danger-on-dark: #FF6B5E;   /* 4.9:1 sobre #16242E */
```

## Personas

Las personas del hogar necesitan color propio para sus chips. No pueden
tomar `--brand` (196°), `--danger` (4°), `--ok` (148°) ni `--warn` (36°):
una persona no es un estado ni la identidad del producto.

```css
--p-1: #C2703D;   /*  25° ámbar quemado */
--p-2: #A85A8E;   /* 318° magenta apagado */
--p-3: #2E7D6B;   /* 168° verde azulado */
```

Se asignan por orden de alta y no cambian.

**Separación contra los matices de dato** (el motor pide ~40° mínimo y esta
tabla faltaba):

| Par | Distancia | Veredicto |
|---|---|---|
| `--p-1` 25° ↔ `--d-debito` 87° | 62° | ✅ |
| `--p-2` 318° ↔ `--d-suscrip` 290° | 28° | ⚠️ nunca aparecen juntos |
| `--p-2` 318° ↔ `--d-credito` 229° | 89° | ✅ |
| `--p-3` 168° ↔ `--d-debito` 87° | 81° | ✅ |

`--p-2` se movió de 268° a 318° porque a 268° quedaba a **39°** de
`--d-credito` (229°) y ambos se pintan adyacentes en la misma fila de
utilización: dos violetas apagados que el ojo lee como el mismo sistema.

## Chip de sobregiro

Al pasar de 100% la barra se clampea y 129% se vería igual que 96%. El estado
se nombra, no se infiere:

- Etiqueta: **`SOBREGIRO`** (mono, mayúsculas)
- Anatomía: chip de estado de DESIGN §6 — `padding: 5px 9px`, 700/9px,
  `--danger` sobre `--danger-050`
- Va **además** del porcentaje, no en su lugar

## Tipo 4 · Card con tratamiento diferenciado

El motor deja los tintes como placeholder. Aquí es la **card de tendencia**:
gráfica a sangre sobre un lavado de marca muy bajo, para que la serie
temporal se lea como pantalla de instrumento y no como card más.

```css
background: linear-gradient(160deg, #F2FAFD 0%, #E4F2F8 100%);
border: 1px solid #CFE6F0;
```

## Tipo 5 · Escalones tonales

Secuencia de tinte de marca **8% → 20%**, en fila y en orden, entre la card
base y la dominante. Nunca salpicados.

```css
--step-1: color-mix(in srgb, var(--brand) 8%, #fff);
--step-2: color-mix(in srgb, var(--brand) 14%, #fff);
--step-3: color-mix(in srgb, var(--brand) 20%, #fff);
```

## Elemento firma específico

**La regleta de ticks.** Cada dato hero se apoya en una escala de
instrumento: marcas de 1px cada 6px, la quinta más alta, desvaneciéndose
hacia el borde. Es lo que convierte una cifra en una *lectura*.

```css
.ticks {
  height: 10px;
  background: repeating-linear-gradient(90deg,
    var(--line) 0 1px, transparent 1px 6px);
  mask-image: linear-gradient(90deg, #000 60%, transparent);
}
```

Aparece en: la card dominante (bajo el dato hero, en blanco 30% sobre la
marca) y bajo el KPI principal de cada pantalla. **No** aparece en filas
de tabla ni en tiles secundarios — perdería su significado.

**Cómo se manifiesta el resto del motor aquí:**
- **Dominante (tipo 2)**: la deuda o el gasto que define la pantalla, con
  halo radial cian en la esquina superior derecha y la regleta debajo.
- **Oscura (tipo 3)**: siempre la **fuga de capital** — intereses,
  comisiones, pagos tardíos. Lleva el `--hatch-dark` obligatorio, que aquí
  significa "dinero que se escapa".
- **Rayado 45°**: reservado a tarjeta archivada, mes sin movimientos y
  estado vacío. Nunca sobre un dato activo.

### Asignación de material por pantalla

Toda pantalla lleva dominante. Una lista sin ancla nace sin identidad: las
cards blancas repetidas son exactamente lo que el motor prohíbe.

| Pantalla | Dominante (tipo 2) | Oscura (tipo 3) |
|---|---|---|
| Inicio | Balance del hogar (débito − deuda) | Fugas del mes |
| Finanzas | Deuda total en crédito | Próximo pago |
| Detalle | Deuda / saldo de la tarjeta | Costo del crédito |
| Análisis | Gasto total del periodo | Fugas de capital |
| Personas | Personas del hogar | — |

Ninguna dominante repite la cifra de otra pantalla: Inicio da la posición neta,
Finanzas la deuda, Análisis el gasto. Si dos pantallas mostraran el mismo hero,
una de las dos sobra.

### Marca plena vs. marca de relleno

`--brand` (`#0A9FD4`) es el acento: arco del gauge, series, foco, filetes,
tinta. **No lleva texto blanco encima**: el blanco sobre él da 3.03:1, y el
texto de un botón es texto normal, que necesita 4.5.

Para eso está `--brand-fill`, que es `--brand-700` (`#076F96`, blanco a 5.64:1).
Lo usan el botón primario, la píldora activa del nav y el selector de mes. La
cifra hero de la dominante sí puede ir en blanco sobre el gradiente pleno
porque a 33px es texto grande y le basta 3:1.

### Por qué las personas viven donde viven

Con marca, cuatro estados y tres matices de dato, el círculo de hue tiene diez
familias: la regla de ~40° del motor es aritméticamente imposible (10 × 40 >
360). Lo que sí se puede es **maximizar el mínimo**, y ahí es donde caen las
tres personas — en los tres huecos más grandes:

| | hue | vecino más cercano |
| --- | --- | --- |
| `--p-3` `#3E7D3A` | 116° | 30° de `--d-debito`, 32° de `--ok` |
| `--p-1` `#7D5CC4` | 259° | 30° de `--d-credito`, 31° de `--d-suscrip` |
| `--p-2` `#AB4E8C` | 320° | 29° de `--d-suscrip`, 44° de `--danger` |

Mínimo del círculo completo: **29°**. Antes era 13° (`--p-1` naranja pegado a
`--warn`) y 18° (`--p-3` verde pegado a `--ok`).

La restricción que de verdad manda, sin embargo, no es el hue: la persona se
dibuja como punto relleno con su inicial **en blanco a 8px**, así que el color
tiene que aguantar texto blanco. Las tres dan 5.0:1. La paleta que había antes
en `lib/colors.ts` —el arcoíris por defecto de Tailwind— no llegaba a 4.5 en
ninguno de sus ocho colores, y dos de ellos eran prácticamente la marca y el
rojo de estado.

Son **tres a propósito**. Con más de tres miembros del hogar, dos comparten
color; se resuelve poniéndoselo a mano en `home_people.color`.

Iguales en los dos temas: el color de una persona es su identidad, no un estado
de la interfaz.

### Retícula del área de contenido

El `<main>` lleva una retícula de puntos de 1px cada 22px. Es **papel de
ingeniería**: el sustrato sobre el que se apoyan los instrumentos. Va como
`background` del propio contenedor con scroll —no como pseudo-elemento— para
que se quede quieta mientras el contenido se desplaza; si se moviera con la
página dejaría de leerse como sustrato.

Se dibuja con `radial-gradient`, no con un asset: tesela perfecto, pesa cero,
es nítida a cualquier densidad y cambia de color con el tema. Un `.avif` no hace
ninguna de las cuatro. Opacidad 7% en claro, 5.5% en oscuro — por debajo del
grano, que sigue siendo la textura dominante del lienzo.

### Hover de control

El gesto es la **regleta**, el mismo elemento firma de la dominante. Al pasar el
mouse el control se levanta 1px y enciende su filo interior; el botón primario
además saca una regleta de ticks por el borde inferior. Con el `active` que baja
1px, se siente como un switch de panel que se asienta.

Se estiliza desde `globals.css` contra `[data-slot="button"]` y
`[data-variant]`, que shadcn ya emite, para no editar a mano
`components/ui/button.tsx`, que genera el CLI. Lo que no es `<Button>` —enlaces
del nav, toggle de tema, botón de colapso— lleva la clase `.ctl`.

La regleta solo aparece en el primario y solo donde hay ancho para leerla: en un
botón de icono cuadrado sería un adorno, no una escala. `focus-visible` recibe
el mismo trato que el hover, y `prefers-reduced-motion` quita el desplazamiento
pero conserva el filo.

### Bisel del pie de sidebar

La card oscura del pie lleva el **dial de ticks** (`/textures/dial.avif`) como
bisel detrás del avatar: cierra el sidebar con el mismo lenguaje de instrumento
que abre la dominante. Va en `screen` a opacidad baja — es un bisel, no un
gráfico.

---

## Tema oscuro

Sigue el motor de `DESIGN.md` §9. Aquí quedan solo las decisiones que son de
este skin, no del motor.

**El lienzo es lo más oscuro de la pantalla.** Grafito frío con el mismo sesgo
azul del tema claro: `--skin-canvas-a: #0a1319`, superficie de card `#14222c`.
El sidebar (`#0c161d`) queda entre los dos, así que sigue leyéndose como un
plano aparte sin necesidad de borde fuerte.

**La card de fugas se levanta, pero con techo.** En claro es lo más oscuro de la
pantalla; aquí es un panel levantado (`#24343c → #16242e`) con filo interior al
16%. **No puede subir más**: por encima de L\* ≈21 el rojo de estado deja de
pasar 4.5:1 sobre ella, y este skin exige que esa cifra se lea a 12px. El
`--hatch-dark` sigue puesto y sigue significando lo mismo —dinero que se
escapa—, y aquí carga más peso que en claro: junto con el filo es lo que
distingue el material cuando la luminancia ya no puede.

**El rojo cambia de tono, no de papel.** `--danger-on-dark` (`#ff6b5e`), que ya
existía para la card oscura, pasa a ser el rojo de estado de toda la interfaz.
El `#d92d20` del tema claro no pasa contraste sobre grafito.

**Los escalones se quedan en 8/14/20%.** Sobre `--surface` oscuro dan ΔL\*
4.3/3.2/3.1, ya por encima del 3.4/2.5/2.6 del tema claro. Hubo un intento de
subirlos a 14/24/34 por verlos planos en una captura reducida; era un artefacto
de la imagen, no del valor.

**La rampa de acero se invierte**: `--cat-1` pasa a ser el más claro. La regla
del skin sigue siendo "mayor monto = más contraste", que sobre oscuro es más
claro.

**Los matices de dato y de persona suben luminancia sin cambiar de hue.** Los
del tema claro son medios tonos pensados para leerse sobre blanco; sobre
grafito se apagan.

**La rampa de marca se parte por USO en oscuro.** `--brand-700` era tinta del
kicker y sustrato de `--brand-fill` a la vez; a `#076F96` sobre la superficie
oscura daba 2.88:1. En `.dark` se separan: `--brand-700: #22AEDE` (tinta,
6.31:1) y `--brand-fill: #0B7BA6` (relleno: 4.77:1 con blanco encima, 3.40:1
contra la superficie). Es el mismo principio de §9 del motor: un token de tinta
no es un token de relleno.

**El overlay del tour lleva la marca, no negro muerto.** `--tour-overlay-color`
es `--brand-900` al 55% en claro; en oscuro sí es negro al 65% y el popover se
despega por el **borde** (`--tour-popover-line: #3D565F`) y el filo — elevación
por filo, como todo en este tema.

### Mecanismo

`next-themes` con `attribute="class"` y `defaultTheme="system"`. El
`@custom-variant dark` está declarado en `globals.css`: sin él las utilidades
`dark:` obedecerían al sistema operativo y no al toggle.

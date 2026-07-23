# SKIN · Admin Home
> Hereda de `DESIGN.md`. Aquí viven la **tesis**, los **tokens** y el **par tipográfico**.
> El método no se repite: si una regla no está aquí, manda `DESIGN.md`.

---

## Tesis

**Un tablero de instrumentos de precisión para la casa.**

La casa es una máquina que consume dinero, y este panel es el medidor
empotrado que la lee: grafito azulado, luz cian detrás del cristal,
cifras en mono como en un display de siete segmentos. Se parece al panel
de un termostato de precisión o a un medidor de consumo — no a una app
de finanzas personales.

Consecuencias de la tesis:
- La luz **viene de adentro** de las superficies (halos, glow), no de un
  drop-shadow genérico encima.
- El dato manda: cada cifra es una lectura de instrumento, no un texto.
- El cian marca **lo que está vivo/activo**; el rojo marca **fuga**.
  Nunca se tocan.

---

## 1 · Par tipográfico

| Rol | Familia | Por qué |
|---|---|---|
| Display / texto | **Archivo** (400·600·700·800) | Grotesca técnica con 800 real para datos hero. No es Inter ni system-ui. |
| Mono / dato | **JetBrains Mono** (400·500·700) | Numerales tabulares nítidos, lectura de instrumento. |

```css
--font-display: "Archivo", sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

La escala por rol es la de `DESIGN.md` §1 sin cambios de proporción.
Toda cifra en columna: `.tnum` (mono + `tabular-nums`), sin excepción.

---

## 2 · Color

### Marca — cian de instrumento (hue ≈ 187°)
Identidad y "vivo". Nunca estado.

```css
--brand-900: #04343A;
--brand-700: #067884;
--brand-600: #089AA8;
--brand:     #0FBDCC;
--brand-100: #B8EFF4;
--brand-050: #E6FAFC;
--grad-brand: linear-gradient(150deg, #0FBDCC 0%, #067884 100%);
```

### Estado — semántica pura
```css
--danger: #FF4D4F;  /* hue ≈ 359° */
--ok:     #86D633;  /* hue ≈ 88°  */
--warn:   #F5A524;  /* hue ≈ 38°  */
```

**Separación de hue (regla crítica de `DESIGN.md` §2):**
`brand 187°` ↔ `danger 359°` = **172°** de separación. Imposible
confundir "activo" con "fuga". `ok 88°` queda a 99° de la marca, tampoco
compite.

### Datos secundarios — 4 matices de baja saturación
Clasifican familias de dato en el bento. No comunican estado ni marca.

```css
--d-indigo: #6B7FD7;  /* crédito */
--d-clay:   #C08457;  /* efectivo / débito */
--d-steel:  #7C93A6;  /* transferencias */
--d-plum:   #9A7AA0;  /* suscripciones */
```

### Neutros — grafito con sesgo frío hacia la marca
Nunca grises muertos: todos llevan azul-cian en las sombras.

```css
--bg:      #0C1114;
--surface: #131B20;
--raise:   #1A242A;
--line:    #24323A;
--fg:      #E4EDF0;
--fg-mut:  #8FA3AD;
--dark-fg: #C6D8DF;
```

### Presupuesto de acento
El cian ocupa **20–25%** de la pantalla, concentrado en: la card
dominante rellena + nav activa + acción primaria. Como **área rellena**,
nunca como filete o píldora fina.

---

## 3 · Material — instancias por pantalla

Radios y sombras concretas para los 5 tipos de `DESIGN.md` §3.

```css
--r-card:    10px;
--r-card-sm: 8px;
--r-inner:   6px;   /* siempre < que su padre */
--r-chip:    4px;

--sh-base:  0 1px 2px rgb(4 10 13 / .5);
--sh-brand: 0 10px 30px rgb(15 189 204 / .22);
--sh-dark:  0 8px 24px rgb(4 10 13 / .6);

--grad-dark: linear-gradient(160deg, #17222A 0%, #0E161B 100%);
```

**Asignación por pantalla** (1 dominante, máx. 2 oscuras no adyacentes):

| Pantalla | Dominante (tipo 2) | Oscura (tipo 3) |
|---|---|---|
| Inicio | Deuda total del hogar | Fugas del mes |
| Finanzas | — (lista) | Próximo pago |
| Detalle | Deuda / saldo de la tarjeta | Costo del crédito |
| Análisis | Gasto total del periodo | Fugas de capital |
| Personas | — (lista) | — |

---

## 4 · Textura

Rayado 45°, 3px/3px, **solo en estado inactivo o vacío** — jamás sobre
dato activo.

```css
--hatch: repeating-linear-gradient(45deg,
  transparent 0 3px, rgb(255 255 255 / .03) 3px 6px);
```

Sobre la card oscura (tipo 3) el overlay de rayado es obligatorio.

---

## Pendiente de `DESIGN.md`

La sección **Radios anidados** llega truncada en el método, así que aquí
se aplica la regla mínima declarada: **ningún hijo con radio ≥ su padre**
(`--r-inner` < `--r-card`). Si el método define proporciones exactas,
ajustar estos valores a esas.

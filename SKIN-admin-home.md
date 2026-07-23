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

> Se descartó un cuarto matiz terracota/arena: caía a ~20–45°, encima de
> `danger` (4°) y `warn` (36°). Tres hues bien separados > cuatro que
> mienten sobre el estado.

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

| Pantalla | Dominante (tipo 2) | Oscura (tipo 3) |
|---|---|---|
| Inicio | Deuda total del hogar | Fugas del mes |
| Finanzas | — (lista) | Próximo pago vencido |
| Detalle | Deuda / saldo de la tarjeta | Costo del crédito |
| Análisis | Gasto total del periodo | Fugas de capital |
| Personas | — (lista) | — |

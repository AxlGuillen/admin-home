# Módulo: finance

## Dominio

Registro de las tarjetas bancarias del hogar (débito y crédito) y el historial de pagos
de cada una, mes a mes.

Fuera de alcance por ahora: presupuestos, inversiones, conexión automática con bancos.

## Estado

**Andamiaje listo, modelo de datos pendiente.** Solo existe `money.ts`. Antes de escribir
código de tarjetas o pagos hay que cerrar las decisiones de la sección de abajo.

## Decisiones pendientes

Preguntar al usuario antes de implementar; no elegir por él:

1. **Corte vs. pago.** ¿Guardamos un registro por estado de cuenta mensual (fecha de corte,
   fecha límite de pago, saldo total, pago mínimo, pago para no generar intereses) y aparte
   los abonos que se hicieron contra él? ¿O solo un pago por mes?
2. **Débito.** Las tarjetas de débito no tienen corte ni pago mínimo. ¿Comparten tabla con
   las de crédito y los campos de crédito quedan nulos, o van en tablas separadas?
3. **Datos sensibles.** ¿Guardamos solo los últimos 4 dígitos y el banco, o el número completo?
   Recomendación fuerte: **solo últimos 4 + banco + alias**. Guardar PANs completos convierte
   esto en un problema de cumplimiento sin ganar nada.
4. **Multi-moneda.** ¿MXN únicamente, o también USD?

## Contrato público

Lo que exporta `index.ts`:

| Export | Tipo | Para qué |
| ------ | ---- | -------- |
| `formatMoney` | función | Formatea centavos a texto legible. |
| `parseMoney` | función | Convierte lo que teclea el usuario a centavos. |
| `Money` | tipo | Monto + moneda. |

## Tablas

Ninguna todavía. Cuando existan: `home_finance_cards`, `home_finance_statements`,
`home_finance_payments`, todas con `user_id` y RLS.

## Invariantes

- **El dinero se guarda en centavos, como `integer`.** Nada de `float` ni `numeric` para
  montos: `0.1 + 0.2` no da `0.3` y con dinero eso se nota.
- Cada monto lleva su moneda explícita. No se asume MXN en la BD.
- Una tarjeta pertenece a un `user_id`. RLS lo hace cumplir, no el código.

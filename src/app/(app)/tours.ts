import type { TourDefinition } from "@/components/tour";
import { analysisTour, cardDetailTour } from "@/modules/finance";

// Guiones de las pantallas compuestas en `app`, y el registro que resuelve el
// tour de la ruta actual. Tono "para qué te sirve" (docs/tour-plan.md).

export const homeTour: TourDefinition = {
  screen: "inicio",
  steps: [
    {
      anchor: "balance",
      title: "El pulso de la casa",
      body: "Lo que hay en débito menos lo que se debe en crédito. Si está en positivo, la casa va bien.",
    },
    {
      anchor: "fuga-mes",
      title: "Lo que costó el crédito",
      body: "Intereses, comisiones e IVA: dinero que se fue sin comprar nada. Aquí se vigila que no crezca.",
    },
    {
      anchor: "nav",
      title: "Los módulos",
      body: "Cada ámbito de la casa es un módulo. Finanzas ya vive; Inventario viene en camino.",
    },
    {
      anchor: "colapso",
      title: "Más espacio",
      body: "Colapsa el menú cuando quieras la pantalla completa para los números.",
    },
    {
      anchor: "tema",
      title: "Claro u oscuro",
      body: "El tema se cambia aquí, y el botón de al lado repite esta guía en cualquier pantalla.",
    },
  ],
};

export const financeTour: TourDefinition = {
  screen: "finanzas",
  steps: [
    {
      anchor: "deuda",
      title: "La deuda del hogar",
      body: "Todo lo que se debe en tarjetas de crédito ahora mismo, contra el límite total.",
    },
    {
      anchor: "proximo-pago",
      title: "La fecha que no se pasa",
      body: "La tarjeta que vence primero y cuántos días faltan. Pagar a tiempo es no regalar intereses.",
    },
    {
      anchor: "tarjetas",
      title: "Las tarjetas",
      body: "Cada una con su corte y su día de pago. Entra a cualquiera para ver sus movimientos mes a mes.",
    },
    {
      anchor: "duenos",
      title: "Filtrar por persona",
      body: "Para ver solo las tarjetas de alguien. Es una etiqueta, no un permiso: todos ven todo.",
    },
    {
      anchor: "analisis",
      title: "El análisis",
      body: "Junta todos los meses: categorías, suscripciones, cobros dobles y el goteo de los comercios recurrentes.",
    },
  ],
};

export const peopleTour: TourDefinition = {
  screen: "personas",
  steps: [
    {
      anchor: "personas",
      title: "Quiénes son de la casa",
      body: "Sirven para etiquetar de quién es cada cosa y filtrar. No restringen nada: todos ven todo.",
    },
    {
      anchor: "asignadas",
      title: "Tarjetas con dueño",
      body: "Cuántas tarjetas ya tienen persona asignada. Las que no, aparecen como 'sin dueño' en Finanzas.",
    },
    {
      anchor: "alta",
      title: "Agregar a alguien",
      body: "Con nombre y color basta; no necesita cuenta en la app.",
    },
  ],
};

export function tourForPath(pathname: string): TourDefinition | null {
  if (pathname === "/") return homeTour;
  if (pathname === "/finance") return financeTour;
  if (pathname === "/finance/analisis") return analysisTour;
  if (pathname.startsWith("/finance/")) return cardDetailTour;
  if (pathname === "/people") return peopleTour;
  return null;
}

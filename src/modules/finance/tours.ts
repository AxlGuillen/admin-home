import type { TourDefinition } from "@/components/tour";

// Guiones de las pantallas cuyo contenido vive en este módulo. Tono "para qué
// te sirve", no "qué es" (docs/tour-plan.md). Los anclajes son los `data-tour`
// de los componentes de `components/`.

export const cardDetailTour: TourDefinition = {
  screen: "detalle",
  steps: [
    {
      anchor: "resumen",
      title: "Esta tarjeta",
      body: "La deuda o el saldo actual, con todo lo que entró y salió en los meses cargados.",
    },
    {
      anchor: "meses",
      title: "Cambiar de mes",
      body: "Cada botón es un corte. Elige otro para revisar qué pasó ese mes.",
    },
    {
      anchor: "orden",
      title: "Ordenar por monto",
      body: "Cambia el orden para cazar el cargo más caro del mes en un vistazo.",
    },
    {
      anchor: "top5",
      title: "Los que se llevaron el mes",
      body: "Los cinco cargos más grandes y qué parte de la salida del mes representan.",
    },
    {
      anchor: "costo",
      title: "Lo que cobra la tarjeta",
      body: "Intereses, comisiones e IVA. Si esta cifra no es cero, la tarjeta te está cobrando por deberle.",
    },
  ],
};

export const analysisTour: TourDefinition = {
  screen: "analisis",
  steps: [
    {
      anchor: "gasto",
      title: "El gasto del hogar",
      body: "Todo el consumo del periodo en una cifra, con el promedio mensual y el mes más alto.",
    },
    {
      anchor: "categorias",
      title: "En qué se va",
      body: "El gasto repartido por categoría. La rebanada grande es la primera sospechosa.",
    },
    {
      anchor: "serie",
      title: "Mes a mes",
      body: "Si algo se disparó, aquí se ve desde cuándo.",
    },
    {
      anchor: "utilizacion",
      title: "Qué tan cargadas van",
      // La cifra en tnum (política del SKIN); driver renderiza el body como HTML.
      body: 'La deuda de cada tarjeta contra su límite. Arriba del <span class="tnum">80%</span> se enciende la alerta.',
    },
    {
      anchor: "fugas",
      title: "Dinero que se escapa",
      body: "Intereses, comisiones y suscripciones que nadie recuerda. Esta card existe para achicarse.",
    },
  ],
};

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerTools } from "./tools";

// Lo que un LLM no puede deducir de los nombres de las herramientas y que, si lo
// adivina mal, produce respuestas que suenan bien y están equivocadas.
const INSTRUCTIONS = `Datos financieros de un hogar en México. Todos los montos que devuelven estas
herramientas van en PESOS, ya convertidos.

Reglas del dominio:
- Hay dos modelos: tarjetas de crédito (estados de cuenta con corte) y cuentas de
  débito (saldo, depósitos y retiros). Las herramientas ya los mezclan.
- "Gasto" excluye por defecto lo que solo mueve dinero: transferencias, pagos de
  tarjeta, ingresos, pagos recibidos y devoluciones. Sumarlos duplica.
- De los cargos a crédito solo cuenta la clase "regular", que es la que cuadra con
  el corte. Las parcialidades de meses sin intereses se piden con scope=with_msi;
  scope=all agrega además comisiones y la compra MSI completa, que se cuenta doble.
- La deuda actual sale del ÚLTIMO corte de cada tarjeta, nunca de la suma.
- Interés, comisiones e IVA no son movimientos: viven en el encabezado del corte y
  se consultan con get_household_overview.

Antes de afirmar algo sobre un periodo, revisa list_cards: la cobertura dice qué
meses hay cargados de cada tarjeta. Si el mes que te preguntan no está, dilo en vez
de responder con lo que sí hay.`;

const server = new McpServer(
  { name: "admin-home", version: "0.1.0" },
  { instructions: INSTRUCTIONS },
);

registerTools(server);

await server.connect(new StdioServerTransport());

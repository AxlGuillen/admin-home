// Renderiza los iconos de la PWA desde la marca (el cuadro cian con el punto
// blanco del sidebar, radio 9/24 y gradiente del SKIN). Correr con
// `npm run icons` cuando cambie la marca; los PNG generados sí se versionan.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const GRAD = `
  <linearGradient id="g" x1="15%" y1="0%" x2="85%" y2="100%">
    <stop offset="0%" stop-color="#12b0e4"/>
    <stop offset="46%" stop-color="#0a9fd4"/>
    <stop offset="100%" stop-color="#076f96"/>
  </linearGradient>`;

// `rounded` reproduce la marca tal cual; sin redondear es para las plataformas
// que recortan ellas (maskable de Android, apple-touch de iOS).
function mark(size, { rounded }) {
  const radius = rounded ? (size * 9) / 24 : 0;
  const dot = size / 6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${GRAD}</defs>
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${dot}" fill="#ffffff"/>
  </svg>`;
}

const OUT = [
  ["icon-192.png", 192, { rounded: true }],
  ["icon-512.png", 512, { rounded: true }],
  ["icon-maskable-512.png", 512, { rounded: false }],
  ["apple-touch-icon.png", 180, { rounded: false }],
];

await mkdir("public", { recursive: true });
for (const [name, size, opts] of OUT) {
  await sharp(Buffer.from(mark(size, opts))).png().toFile(`public/${name}`);
  console.log(`public/${name} (${size}px)`);
}

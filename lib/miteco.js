// Fuente oficial: Ministerio para la Transición Ecológica (MITECO)
// Datos públicos y gratuitos de precios de carburantes en España.
// https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres

const MITECO_URL =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";

// Combustible usado para ordenar/filtrar -> campo exacto de la API
export const FUEL_FIELDS = {
  "95": "Precio Gasolina 95 E5",
  "98": "Precio Gasolina 98 E5",
  diesel: "Precio Gasoleo A",
  diesel_premium: "Precio Gasoleo Premium",
};

export const FUEL_LABELS = {
  "95": "Gasolina 95",
  "98": "Gasolina 98",
  diesel: "Diésel",
  diesel_premium: "Diésel Premium",
};

// Las 17 comunidades + 2 ciudades autónomas, en orden alfabético.
export const CCAA_LIST = [
  "Andalucía",
  "Aragón",
  "Asturias",
  "Illes Balears",
  "Canarias",
  "Cantabria",
  "Castilla y León",
  "Castilla-La Mancha",
  "Cataluña",
  "Ceuta",
  "Comunitat Valenciana",
  "Extremadura",
  "Galicia",
  "Madrid",
  "Melilla",
  "Murcia",
  "Navarra",
  "País Vasco",
  "La Rioja",
];

// Mapeo provincia (texto libre de la API) -> comunidad autónoma, por
// coincidencia de palabra clave normalizada (sin acentos, minúsculas).
// La API de MITECO no siempre da el nombre de la provincia en el mismo
// formato (p.ej. "Rioja, La" o "Coruña, A"), por eso se hace por inclusión
// de token en vez de igualdad exacta.
const PROVINCIA_KEYWORDS = [
  ["Andalucía", ["almeria", "cadiz", "cordoba", "granada", "huelva", "jaen", "malaga", "sevilla"]],
  ["Aragón", ["huesca", "teruel", "zaragoza"]],
  ["Asturias", ["asturias"]],
  ["Illes Balears", ["balear"]],
  ["Canarias", ["palmas", "tenerife"]],
  ["Cantabria", ["cantabria"]],
  [
    "Castilla y León",
    ["avila", "burgos", "leon", "palencia", "salamanca", "segovia", "soria", "valladolid", "zamora"],
  ],
  ["Castilla-La Mancha", ["albacete", "ciudad real", "cuenca", "guadalajara", "toledo"]],
  ["Cataluña", ["barcelona", "girona", "lleida", "tarragona"]],
  ["Ceuta", ["ceuta"]],
  ["Comunitat Valenciana", ["alicante", "alacant", "castellon", "castello", "valencia"]],
  ["Extremadura", ["badajoz", "caceres"]],
  ["Galicia", ["coruna", "lugo", "ourense", "pontevedra"]],
  ["Madrid", ["madrid"]],
  ["Melilla", ["melilla"]],
  ["Murcia", ["murcia"]],
  ["Navarra", ["navarra"]],
  ["País Vasco", ["araba", "alava", "bizkaia", "vizcaya", "gipuzkoa", "guipuzcoa"]],
  ["La Rioja", ["rioja"]],
];

function normalize(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getComunidad(provincia) {
  const n = normalize(provincia);
  for (const [comunidad, keywords] of PROVINCIA_KEYWORDS) {
    if (keywords.some((k) => n.includes(k))) return comunidad;
  }
  return "Otras";
}

function parseDecimalEs(value) {
  if (!value) return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Descarga el listado completo de estaciones de España.
// Cacheado 30 min por Next.js para no golpear la API del Ministerio
// en cada request de usuario.
export async function fetchEstaciones() {
  const res = await fetch(MITECO_URL, {
    next: { revalidate: 1800 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`MITECO respondió ${res.status}`);

  const data = await res.json();
  return Array.isArray(data.ListaEESSPrecio) ? data.ListaEESSPrecio : [];
}

// Parsea una estación cruda de la API a un objeto limpio con TODOS los
// precios de combustible disponibles (no solo el usado para ordenar).
function parseStation(s) {
  const lat = parseDecimalEs(s["Latitud"]);
  const lng = parseDecimalEs(s["Longitud (WGS84)"]);
  if (lat === null || lng === null) return null;

  const precios = {};
  for (const [key, field] of Object.entries(FUEL_FIELDS)) {
    precios[key] = parseDecimalEs(s[field]);
  }

  return {
    id: s["IDEESS"],
    rotulo: s["Rótulo"] || "Estación sin nombre",
    direccion: s["Dirección"] || "",
    localidad: s["Localidad"] || "",
    municipio: s["Municipio"] || "",
    provincia: s["Provincia"] || "",
    comunidad: getComunidad(s["Provincia"]),
    cp: s["C.P."] || "",
    horario: s["Horario"] || "",
    precios,
    lat,
    lng,
  };
}

// Ranking nacional/por ciudad para un único combustible (usado por el buscador).
export function buildRanking(rawStations, { fuel, city, limit = 10 }) {
  if (!FUEL_FIELDS[fuel]) throw new Error(`Combustible no soportado: ${fuel}`);
  const cityNorm = city ? normalize(city) : null;

  const parsed = rawStations
    .map(parseStation)
    .filter((s) => s && s.precios[fuel] !== null);

  const filtered = cityNorm
    ? parsed.filter(
        (s) =>
          normalize(s.municipio).includes(cityNorm) ||
          normalize(s.localidad).includes(cityNorm) ||
          normalize(s.provincia).includes(cityNorm)
      )
    : parsed;

  filtered.sort((a, b) => a.precios[fuel] - b.precios[fuel]);

  return filtered.slice(0, limit).map((s) => ({ ...s, precio: s.precios[fuel] }));
}

// Ranking de las N estaciones más baratas de CADA comunidad autónoma,
// para un combustible dado. Usado por el mapa principal.
export function buildRegionalRanking(rawStations, { fuel, limit = 10 }) {
  if (!FUEL_FIELDS[fuel]) throw new Error(`Combustible no soportado: ${fuel}`);

  const parsed = rawStations
    .map(parseStation)
    .filter((s) => s && s.precios[fuel] !== null && s.comunidad !== "Otras");

  const byComunidad = new Map();
  for (const s of parsed) {
    if (!byComunidad.has(s.comunidad)) byComunidad.set(s.comunidad, []);
    byComunidad.get(s.comunidad).push(s);
  }

  return CCAA_LIST.filter((c) => byComunidad.has(c)).map((comunidad) => {
    const list = byComunidad.get(comunidad);
    list.sort((a, b) => a.precios[fuel] - b.precios[fuel]);
    return {
      comunidad,
      resultados: list.slice(0, limit).map((s) => ({ ...s, precio: s.precios[fuel] })),
    };
  });
}

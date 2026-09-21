import { NextResponse } from "next/server";
import {
  fetchEstaciones,
  buildRegionalRanking,
  buildDebugInfo,
  FUEL_FIELDS,
} from "@/lib/miteco";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fuel = searchParams.get("combustible") || "95";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);
  const debug = searchParams.get("debug") === "1";

  if (!FUEL_FIELDS[fuel]) {
    return NextResponse.json(
      { error: `Combustible no soportado. Usa: ${Object.keys(FUEL_FIELDS).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const estaciones = await fetchEstaciones();

    if (debug) {
      return NextResponse.json(buildDebugInfo(estaciones));
    }

    const comunidades = buildRegionalRanking(estaciones, { fuel, limit });

    return NextResponse.json({
      combustible: fuel,
      actualizado: new Date().toISOString(),
      totalComunidades: comunidades.length,
      comunidades,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo obtener el precio de carburantes ahora mismo.", detalle: err.message },
      { status: 502 }
    );
  }
}

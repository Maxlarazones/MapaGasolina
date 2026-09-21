"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const StationMap = dynamic(() => import("@/components/StationMap"), {
  ssr: false,
  loading: () => <div className="map-full-loading">Cargando mapa…</div>,
});

const FUEL_OPTIONS = [
  { value: "95", label: "Gasolina 95" },
  { value: "98", label: "Gasolina 98" },
  { value: "diesel", label: "Diésel" },
  { value: "diesel_premium", label: "Diésel Premium" },
];

export default function Home() {
  const [fuel, setFuel] = useState("95");
  const [stations, setStations] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async (fuelValue) => {
    setError(null);
    try {
      const res = await fetch(`/api/precios-por-comunidad?combustible=${fuelValue}&limit=10`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error desconocido");
      setStations(json.comunidades.flatMap((c) => c.resultados));
    } catch (err) {
      setError(err.message);
      setStations([]);
    }
  }, []);

  useEffect(() => {
    load(fuel);
  }, [fuel, load]);

  return (
    <div className="map-page">
      <div className="fuel-control">
        <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
          {FUEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="map-error">⚠️ {error}</div>}

      <StationMap stations={stations} activeFuel={fuel} />
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const StationMap = dynamic(() => import("@/components/StationMap"), {
  ssr: false,
  loading: () => <div className="map-wrapper">Cargando mapa…</div>,
});

const FUEL_OPTIONS = [
  { value: "95", label: "Gasolina 95" },
  { value: "98", label: "Gasolina 98" },
  { value: "diesel", label: "Diésel" },
  { value: "diesel_premium", label: "Diésel Premium" },
];

export default function Home() {
  // --- Mapa por comunidad (sección principal) ---
  const [fuel, setFuel] = useState("95");
  const [regional, setRegional] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState(null);

  const loadRegional = useCallback(async (fuelValue) => {
    setLoadingMap(true);
    setMapError(null);
    try {
      const res = await fetch(`/api/precios-por-comunidad?combustible=${fuelValue}&limit=10`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error desconocido");
      setRegional(json);
    } catch (err) {
      setMapError(err.message);
      setRegional(null);
    } finally {
      setLoadingMap(false);
    }
  }, []);

  useEffect(() => {
    loadRegional(fuel);
  }, [fuel, loadRegional]);

  const allStations = regional
    ? regional.comunidades.flatMap((c) => c.resultados)
    : [];

  // --- Buscador por ciudad (sección secundaria) ---
  const [searchFuel, setSearchFuel] = useState("95");
  const [city, setCity] = useState("");
  const [searchData, setSearchData] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setLoadingSearch(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({ combustible: searchFuel, limit: "10" });
      if (city) params.set("ciudad", city);
      const res = await fetch(`/api/precios?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error desconocido");
      setSearchData(json);
    } catch (err) {
      setSearchError(err.message);
      setSearchData(null);
    } finally {
      setLoadingSearch(false);
    }
  }

  return (
    <main className="container">
      <h1>⛽ Gasolineras más baratas de España</h1>
      <p className="subtitle">
        Datos oficiales del Ministerio para la Transición Ecológica. Top 10 más
        baratas de cada comunidad autónoma, con el precio de los 4 tipos de
        combustible.
      </p>

      <div className="filters">
        <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
          {FUEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {mapError && <p className="status error">⚠️ {mapError}</p>}
      {regional && !mapError && (
        <p className="status">
          {allStations.length} estaciones en {regional.totalComunidades} comunidades ·
          actualizado {new Date(regional.actualizado).toLocaleString("es-ES")}
        </p>
      )}

      <StationMap stations={allStations} activeFuel={fuel} />

      {regional && (
        <div className="regions">
          {regional.comunidades.map((c) => (
            <details key={c.comunidad} className="region-block">
              <summary>
                {c.comunidad} — desde {c.resultados[0]?.precio.toFixed(3)} €/l
              </summary>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estación</th>
                    <th>Municipio</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {c.resultados.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>{s.rotulo}</td>
                      <td>{s.municipio}</td>
                      <td className="precio">{s.precio.toFixed(3)} €/l</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))}
        </div>
      )}

      <hr style={{ margin: "36px 0", border: "none", borderTop: "1px solid #ddd" }} />

      <h2 style={{ fontSize: "1.15rem" }}>Buscar por ciudad o provincia</h2>
      <form className="filters" onSubmit={handleSearch}>
        <select value={searchFuel} onChange={(e) => setSearchFuel(e.target.value)}>
          {FUEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Ciudad o provincia"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" disabled={loadingSearch}>
          {loadingSearch ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {searchError && <p className="status error">⚠️ {searchError}</p>}

      {searchData && searchData.resultados.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Estación</th>
                <th>Dirección</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {searchData.resultados.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.rotulo}</td>
                  <td>
                    {s.direccion}, {s.municipio} ({s.provincia})
                  </td>
                  <td className="precio">{s.precio.toFixed(3)} €/l</td>
                </tr>
              ))}
            </tbody>
          </table>
          <StationMap stations={searchData.resultados} activeFuel={searchFuel} />
        </>
      )}

      {searchData && searchData.resultados.length === 0 && !loadingSearch && (
        <p className="status">No se encontraron estaciones para esa búsqueda.</p>
      )}

      <footer>
        Fuente: Geoportal de Precios de Carburantes, Ministerio para la
        Transición Ecológica (MITECO). Dato público oficial.
      </footer>
    </main>
  );
}

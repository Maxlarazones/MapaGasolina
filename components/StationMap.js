"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { FUEL_LABELS } from "@/lib/miteco";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SPAIN_CENTER = [40.0, -3.7038];
const SPAIN_ZOOM = 6;

// Fix de un bug clásico de Leaflet + React: si el contenedor todavía no
// tenía su tamaño final (100vh) en el momento exacto en que el mapa se
// inicializa, Leaflet se queda con el tamaño viejo "cacheado" y el drag/zoom
// se comporta raro o parece no responder fuera de esa zona. Forzamos un
// recálculo apenas monta y en cada resize de ventana.
function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t = setTimeout(fix, 200);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fix);
    };
  }, [map]);

  return null;
}

export default function StationMap({ stations, activeFuel }) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={SPAIN_CENTER}
        zoom={SPAIN_ZOOM}
        style={{ height: "100%", width: "100%" }}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        boxZoom={true}
        keyboard={true}
        zoomControl={true}
      >
        <MapSizeFix />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
            <Popup>
              <strong>{s.rotulo}</strong>
              <br />
              {s.direccion}
              <br />
              {s.municipio} · {s.comunidad}
              <table style={{ marginTop: 6, fontSize: "0.85em" }}>
                <tbody>
                  {Object.entries(FUEL_LABELS).map(([key, label]) => {
                    const precio = s.precios ? s.precios[key] : key === activeFuel ? s.precio : null;
                    if (precio === null || precio === undefined) return null;
                    const isActive = key === activeFuel;
                    return (
                      <tr key={key}>
                        <td style={{ paddingRight: 8 }}>{label}</td>
                        <td
                          style={{
                            fontWeight: isActive ? 700 : 400,
                            color: isActive ? "#1e7d32" : "#333",
                          }}
                        >
                          {precio.toFixed(3)} €/l
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

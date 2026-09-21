"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function StationMap({ stations, activeFuel }) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={SPAIN_CENTER}
        zoom={SPAIN_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
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

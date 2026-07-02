import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { NAIROBI_CENTER, DEFAULT_ZOOM, toGeoJSON } from "../map/mapHelpers";

// Custom divIcon, matching priceMarker.js's approach — Leaflet's default
// marker image doesn't resolve under Vite without extra config, so every
// map pin in this app already uses a divIcon instead.
const pinIcon = L.divIcon({
  html: `<div style="transform:translate(-50%,-100%)" class="w-6 h-6 bg-secondary-container rounded-full border-2 border-white shadow-lg"></div>`,
  className: "",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Reports clicks back as GeoJSON [lng, lat].
function ClickToPlace({ onChange }) {
  useMapEvents({
    click: (event) => onChange(toGeoJSON(event.latlng)),
  });
  return null;
}

// value: [lng, lat] GeoJSON coordinates, or null/[0,0] for "not set yet".
export default function LocationPicker({ value, onChange }) {
  const hasValue = Array.isArray(value) && (value[0] !== 0 || value[1] !== 0);
  const position = hasValue ? [value[1], value[0]] : null; // -> Leaflet [lat,lng]

  return (
    <div className="h-64 rounded-lg overflow-hidden border border-hairline">
      <MapContainer
        center={position || NAIROBI_CENTER}
        zoom={position ? 15 : DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPlace onChange={onChange} />
        {position && <Marker position={position} icon={pinIcon} />}
      </MapContainer>
    </div>
  );
}

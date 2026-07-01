import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { buildPriceIcon } from "./priceMarker";
import MapPreviewPopup from "./MapPreviewPopup";
import {
  toLeaflet,
  boundsToBox,
  hasRealCoords,
  NAIROBI_CENTER,
  DEFAULT_ZOOM,
} from "./mapHelpers";

// Fires the initial fetch once the map has real bounds, and flags when the user
// has moved the map so the "Search this area" button can appear.
function MapEvents({ onReady, onMoved }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useMapEvents({ moveend: () => onMoved() });
  return null;
}

// Pans/zooms to the selected listing when selection changes (e.g. card click).
function PanToSelected({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
  }, [position, map]);
  return null;
}

// One marker. Manages its own ref so the popup opens when it becomes active,
// including when selection originates from a list-pane card click.
function ListingMarker({ listing, active, hovered, onSelect, onHover }) {
  const ref = useRef(null);
  useEffect(() => {
    if (active && ref.current) ref.current.openPopup();
  }, [active]);

  const position = toLeaflet(listing.location.coordinates);
  if (!position) return null;

  return (
    <Marker
      ref={ref}
      position={position}
      icon={buildPriceIcon({ price: listing.price, active, hovered })}
      zIndexOffset={active ? 1000 : hovered ? 500 : 0}
      eventHandlers={{
        click: () => onSelect(listing._id),
        mouseover: () => onHover(listing._id),
        mouseout: () => onHover(null),
      }}
    >
      {active && (
        <Popup>
          <MapPreviewPopup listing={listing} />
        </Popup>
      )}
    </Marker>
  );
}

// Right pane: the interactive Leaflet map. Isolated so a later provider swap
// touches only this file. Overlay chrome (search button + zoom/locate controls)
// matches the Stitch Map View design.
export default function ListingMap({
  listings,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  onRequestListings,
  moved,
  onMoved,
  onSearchArea,
}) {
  const mapRef = useRef(null);

  const handleReady = (map) => {
    mapRef.current = map;
    onRequestListings(boundsToBox(map.getBounds()));
  };

  const searchThisArea = () => {
    if (mapRef.current) onSearchArea(boundsToBox(mapRef.current.getBounds()));
  };

  const selected = listings.find((l) => l._id === selectedId);
  const selectedPos =
    selected && hasRealCoords(selected)
      ? toLeaflet(selected.location.coordinates)
      : null;

  return (
    <section className="flex-1 relative bg-surface-dim">
      <MapContainer
        center={NAIROBI_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        className="absolute inset-0 h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents onReady={handleReady} onMoved={onMoved} />
        <PanToSelected position={selectedPos} />

        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
          {listings.filter(hasRealCoords).map((listing) => (
            <ListingMarker
              key={listing._id}
              listing={listing}
              active={listing._id === selectedId}
              hovered={listing._id === hoveredId}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Search this area — appears after the user pans/zooms */}
      {moved && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            type="button"
            onClick={searchThisArea}
            className="bg-surface-container-lowest px-6 py-2.5 rounded-full shadow-lg border border-hairline font-body-strong text-sm text-primary flex items-center gap-2 hover:bg-surface-bone transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Search this area
          </button>
        </div>
      )}

      {/* Zoom + locate controls */}
      <div className="absolute bottom-10 right-10 flex flex-col gap-2 z-[1000]">
        <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-hairline flex flex-col overflow-hidden">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapRef.current?.zoomIn()}
            className="p-3 hover:bg-surface-bone border-b border-hairline transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapRef.current?.zoomOut()}
            className="p-3 hover:bg-surface-bone transition-colors"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button
          type="button"
          aria-label="My location"
          onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 15 })}
          className="bg-surface-container-lowest p-3 rounded-xl shadow-lg border border-hairline hover:bg-surface-bone transition-colors"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>
    </section>
  );
}

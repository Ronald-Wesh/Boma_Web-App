import L from "leaflet";
import { pricePill } from "./mapHelpers";

// Builds the Leaflet divIcon for a listing pin. Two visual states from the
// Stitch design: a honey circle with a ping when active/selected, otherwise a
// white price pill (honey-bordered when its card is hovered).
//
// The inner wrapper is translated -50%/-50% so the pill centers on the exact
// coordinate regardless of its width (iconSize [0,0] anchors at top-left).
export function buildPriceIcon({ price, active = false, hovered = false }) {
  const label = pricePill(price);

  const inner = active
    ? `<div class="relative flex items-center justify-center">
         <div class="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-honey-ink font-price-tabular text-sm shadow-2xl border-4 border-white">${label}</div>
         <div class="absolute w-24 h-24 bg-secondary-container/20 rounded-full animate-ping pointer-events-none"></div>
       </div>`
    : `<div class="bg-surface-container-lowest border ${
        hovered ? "border-secondary-container ring-2 ring-secondary-container/40" : "border-hairline"
      } px-3 py-1.5 rounded-full shadow-lg font-price-tabular text-sm text-primary whitespace-nowrap transition-transform hover:scale-110">${label}</div>`;

  return L.divIcon({
    html: `<div style="transform:translate(-50%,-50%);width:max-content">${inner}</div>`,
    className: "", // drop Leaflet's default white square
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

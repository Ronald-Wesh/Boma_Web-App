import { useCallback, useEffect, useRef, useState } from "react";
import { listingAPI } from "../Utils/api";

// Fetches listings within a viewport box, debounced, and exposes the single
// listings array that both the map pins and the list pane render from.
//
// Usage: call `fetchWithin(box, filters)` on map-ready, on "Search this area",
// and whenever filters change (with the current box). Debounced so rapid
// filter typing / repeated triggers collapse into one request.
export default function useMapListings({ debounceMs = 350 } = {}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timer = useRef(null);
  // Track the latest request so a slow earlier response can't clobber a newer one.
  const requestId = useRef(0);

  const run = useCallback(async (box, filters) => {
    if (!box) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const params = { ...box, ...filters };
      const { data } = await listingAPI.getListingsWithin({ params });
      if (id !== requestId.current) return; // a newer request superseded this one
      setListings(data.listings || []);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err);
      // Keep the last good results rather than blanking the map on a transient error.
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const fetchWithin = useCallback(
    (box, filters) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => run(box, filters), debounceMs);
    },
    [run, debounceMs],
  );

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return { listings, loading, error, fetchWithin };
}

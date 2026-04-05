import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { buildingAPI, listingAPI } from "../Utils/api";
import {
  buildOpenStreetMapEmbedUrl,
  isValidImageUrl,
  splitCommaSeparated,
} from "../Utils/listings";

const initialFormState = {
  title: "",
  description: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  status: "available",
  buildingId: "",
  amenities: "",
  features: "",
  lng: "36.8219",
  lat: "-1.2921",
  images: [""],
};

function Field({ label, children, hint }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialFormState);
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBuildings = async () => {
      try {
        const response = await buildingAPI.getAllBuildings();
        if (isMounted) {
          setBuildings(response.data.buildings || []);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error.response?.data?.message || "Failed to load buildings");
        }
      } finally {
        if (isMounted) {
          setLoadingBuildings(false);
        }
      }
    };

    fetchBuildings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateImage = (index, value) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? value : image,
      ),
    }));
  };

  const addImageField = () => {
    setForm((current) => ({ ...current, images: [...current.images, ""] }));
  };

  const removeImageField = (index) => {
    setForm((current) => ({
      ...current,
      images:
        current.images.length === 1
          ? [""]
          : current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const adjustCoordinate = (field, delta) => {
    setForm((current) => {
      const currentValue = Number(current[field]) || 0;
      return {
        ...current,
        [field]: (currentValue + delta).toFixed(6),
      };
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField("lng", position.coords.longitude.toFixed(6));
        updateField("lat", position.coords.latitude.toFixed(6));
      },
      () => {
        toast.error("Unable to read your current location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const filteredImages = form.images.map((image) => image.trim()).filter(Boolean);
    const invalidImage = filteredImages.find((image) => !isValidImageUrl(image));

    if (invalidImage) {
      toast.error("Each image must be a valid http/https URL");
      return;
    }

    if (!form.buildingId) {
      toast.error("Select a building before creating a listing");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        status: form.status,
        buildingId: form.buildingId,
        amenities: splitCommaSeparated(form.amenities),
        features: splitCommaSeparated(form.features),
        images: filteredImages,
        location: {
          type: "Point",
          coordinates: [Number(form.lng), Number(form.lat)],
        },
      };

      const response = await listingAPI.createListing(payload);
      const createdListing = response.data.listing;
      toast.success("Listing created");
      navigate(`/listings/${createdListing._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  const mapUrl = buildOpenStreetMapEmbedUrl(Number(form.lng), Number(form.lat));

  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#fff7ed_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            Landlord Workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Create a new listing
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This form sends GeoJSON coordinates as <span className="font-semibold text-slate-800">[lng, lat]</span>,
            validates image URLs before submit, and requires an existing building reference.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Core details</h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Title">
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(event) => updateField("title", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      required
                      rows="6"
                      value={form.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                  </Field>
                </div>

                <Field label="Price (KES)">
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </Field>

                <Field label="Bedrooms">
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.bedrooms}
                    onChange={(event) => updateField("bedrooms", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <Field label="Bathrooms">
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.bathrooms}
                    onChange={(event) => updateField("bathrooms", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Building"
                    hint={loadingBuildings ? "Loading available buildings..." : "Select the building this unit belongs to."}
                  >
                    <select
                      required
                      disabled={loadingBuildings || buildings.length === 0}
                      value={form.buildingId}
                      onChange={(event) => updateField("buildingId", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:opacity-60"
                    >
                      <option value="">Select a building</option>
                      {buildings.map((building) => (
                        <option key={building._id} value={building._id}>
                          {building.name} · {building.address}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Amenities and features</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field
                  label="Amenities"
                  hint="Comma-separated values, for example WiFi, Parking, Water storage"
                >
                  <textarea
                    rows="4"
                    value={form.amenities}
                    onChange={(event) => updateField("amenities", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <Field
                  label="Features"
                  hint="Comma-separated values, for example Balcony, Corner unit, Furnished"
                >
                  <textarea
                    rows="4"
                    value={form.features}
                    onChange={(event) => updateField("features", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">Image URLs</h2>
                <button
                  type="button"
                  onClick={addImageField}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Add image
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {form.images.map((image, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="url"
                      value={image}
                      onChange={(event) => updateImage(index, event.target.value)}
                      placeholder="https://example.com/listing-image.jpg"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">Coordinate picker</h2>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                >
                  Use my location
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <Field label="Longitude (first)" hint="GeoJSON requires [lng, lat] ordering.">
                  <input
                    type="number"
                    step="any"
                    value={form.lng}
                    onChange={(event) => updateField("lng", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => adjustCoordinate("lng", -0.001)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    W
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustCoordinate("lat", 0.001)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    N
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustCoordinate("lng", 0.001)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    E
                  </button>
                </div>

                <Field label="Latitude (second)">
                  <input
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={(event) => updateField("lat", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </Field>

                <button
                  type="button"
                  onClick={() => adjustCoordinate("lat", -0.001)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Move South
                </button>
              </div>
            </section>

            {mapUrl && (
              <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">Map preview</h2>
                </div>
                <iframe title="Selected listing coordinates" src={mapUrl} className="h-[280px] w-full border-0" />
              </section>
            )}

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <button
                type="submit"
                disabled={submitting || loadingBuildings || buildings.length === 0}
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {submitting ? "Creating listing..." : "Create listing"}
              </button>

              {buildings.length === 0 && !loadingBuildings && (
                <p className="mt-4 text-sm leading-6 text-amber-700">
                  No buildings are available yet. Create a building record before adding listings.
                </p>
              )}
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}

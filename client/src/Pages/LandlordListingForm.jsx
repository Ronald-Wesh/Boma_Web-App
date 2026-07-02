import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI } from "../Utils/api";
import LocationPicker from "../components/landlord/LocationPicker";

const INPUT_CLASS =
  "w-full bg-transparent border border-hairline rounded-lg px-4 py-3 " +
  "focus:outline-none focus:border-primary font-body-main text-body-main " +
  "text-primary placeholder:text-outline-variant transition-colors";
const LABEL_CLASS =
  "block font-label-eyebrow text-label-eyebrow text-slate-muted uppercase mb-2";

const ROOM_TYPES = [
  "bedsitter",
  "single_room",
  "shared_room",
  "studio",
  "one_bedroom",
  "two_bedroom",
  "other",
];
const STATUSES = ["available", "unavailable", "pending"];

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  buildingName: "",
  address: "",
  roomType: "other",
  bedrooms: "",
  bathrooms: "",
  features: "",
  amenities: "",
  images: "",
  status: "available",
  location: null, // [lng, lat] | null
};

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase whitespace-nowrap">
        {children}
      </span>
      <span className="flex-grow border-t border-hairline" />
    </div>
  );
}

const toCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const fromCsv = (str) =>
  str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const toLines = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
const fromLines = (str) =>
  str
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

export default function LandlordListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [buildingName, setBuildingName] = useState(""); // display-only on edit
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await listingAPI.getListingById(id);
        if (!active) return;
        setForm({
          title: data.title || "",
          description: data.description || "",
          price: data.price ?? "",
          buildingName: "",
          address: data.address || "",
          roomType: data.roomType || "other",
          bedrooms: data.bedrooms ?? "",
          bathrooms: data.bathrooms ?? "",
          features: toCsv(data.features),
          amenities: toCsv(data.amenities),
          images: toLines(data.images),
          status: data.status || "available",
          location: data.location?.coordinates || null,
        });
        setBuildingName(data.building?.name || "");
      } catch (err) {
        toast.error(err.response?.data?.message || "Couldn't load this listing");
        navigate("/landlord/dashboard");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit, navigate]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    if (!form.title.trim()) return "Enter a title.";
    if (!form.description.trim()) return "Enter a description.";
    const price = Number(form.price);
    if (!price || price <= 0) return "Enter a valid price.";
    if (!isEdit && !form.buildingName.trim()) return "Enter the building name.";
    if (!isEdit && !form.address.trim()) return "Enter the address.";
    if (!form.location) return "Click the map to set the location.";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      address: form.address.trim(),
      roomType: form.roomType,
      bedrooms: form.bedrooms === "" ? undefined : Number(form.bedrooms),
      bathrooms: form.bathrooms === "" ? undefined : Number(form.bathrooms),
      features: fromCsv(form.features),
      amenities: fromCsv(form.amenities),
      images: fromLines(form.images),
      status: form.status,
      location: { type: "Point", coordinates: form.location },
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await listingAPI.updateListing(id, payload);
        toast.success("Listing updated");
      } else {
        await listingAPI.createListing({
          ...payload,
          buildingName: form.buildingName.trim(),
        });
        toast.success("Listing created");
      }
      navigate("/landlord/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save this listing");
    } finally {
      setSubmitting(false);
    }
  };

  const roomTypeOptions = useMemo(
    () =>
      ROOM_TYPES.map((t) => (
        <option key={t} value={t}>
          {t.replace(/_/g, " ")}
        </option>
      )),
    [],
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-grid-margin py-section-gap space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-container animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-3xl mx-auto px-grid-margin">
          <Link
            to="/landlord/dashboard"
            className="inline-flex items-center gap-1 font-label-eyebrow text-[10px] text-slate-muted uppercase hover:text-primary transition-colors mb-stack-md"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            back to dashboard
          </Link>
          <h1 className="font-display-hero text-display-hero-mobile text-primary lowercase">
            {isEdit ? "edit listing" : "add a listing"}
          </h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto px-grid-margin py-section-gap space-y-6"
      >
        <SectionHeading>the basics</SectionHeading>
        <div className="space-y-6 mb-section-gap">
          <Field label="title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="cozy bedsitter near campus"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="describe the space, the neighbourhood, what's included…"
              className={`${INPUT_CLASS} resize-none`}
            />
          </Field>
          <Field label="price / month (KSh)">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="12000"
              className={`${INPUT_CLASS} font-price-tabular`}
            />
          </Field>
        </div>

        <SectionHeading>location</SectionHeading>
        <div className="space-y-6 mb-section-gap">
          {isEdit ? (
            <Field label="building">
              <p className="font-body-main text-primary">{buildingName || "—"}</p>
              <p className="font-body-main text-xs text-slate-muted mt-1">
                the building can't be changed after a listing is created.
              </p>
            </Field>
          ) : (
            <Field label="building name">
              <input
                type="text"
                value={form.buildingName}
                onChange={(e) => set("buildingName", e.target.value)}
                placeholder="qwetu hostels"
                className={INPUT_CLASS}
              />
            </Field>
          )}
          <Field label="address">
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="off thika road, ruiru"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="pin the location on the map">
            <LocationPicker
              value={form.location}
              onChange={(coords) => set("location", coords)}
            />
          </Field>
        </div>

        <SectionHeading>details</SectionHeading>
        <div className="space-y-6 mb-section-gap">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Field label="room type">
              <select
                value={form.roomType}
                onChange={(e) => set("roomType", e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                {roomTypeOptions}
              </select>
            </Field>
            <Field label="bedrooms">
              <input
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="bathrooms">
              <input
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
          <Field label="features (comma-separated)">
            <input
              type="text"
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
              placeholder="balcony, furnished, parking"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="amenities (comma-separated)">
            <input
              type="text"
              value={form.amenities}
              onChange={(e) => set("amenities", e.target.value)}
              placeholder="wifi, water backup, security"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="image URLs (one per line)">
            <textarea
              value={form.images}
              onChange={(e) => set("images", e.target.value)}
              rows={3}
              placeholder={"https://…\nhttps://…"}
              className={`${INPUT_CLASS} resize-none font-mono text-xs`}
            />
          </Field>
          <Field label="status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={`${INPUT_CLASS} cursor-pointer`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-4 pt-stack-md border-t border-hairline">
          <button
            type="submit"
            disabled={submitting}
            className="bg-secondary-container text-honey-ink font-body-strong px-10 py-3 rounded-full lowercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
          >
            {submitting ? "saving…" : isEdit ? "save changes" : "create listing"}
          </button>
          <Link
            to="/landlord/dashboard"
            className="font-body-strong text-slate-muted lowercase hover:text-primary transition-colors px-4 py-3"
          >
            cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

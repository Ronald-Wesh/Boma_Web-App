import {
  ROOM_TYPE_OPTIONS,
  AMENITY_OPTIONS,
  BUDGET,
} from "../../data/browseFilters";

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-hairline text-secondary-container focus:ring-secondary-container"
      />
      <span
        className={`text-sm transition-colors ${
          checked
            ? "font-body-strong text-secondary-container"
            : "font-body-main group-hover:text-primary"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-label-eyebrow text-label-eyebrow text-on-surface-variant uppercase mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Browse sidebar. Fully controlled — all state lives in the Browse page.
export default function ListingFilters({
  campuses,
  selected,
  onToggleCampus,
  onToggleRoomType,
  onToggleAmenity,
  budget,
  onBudget,
}) {
  return (
    <div className="space-y-10">
      <Section title="Campus">
        <div className="space-y-3">
          {campuses.length === 0 && (
            <p className="text-sm text-on-surface-variant/60 font-body-main">
              Loading campuses…
            </p>
          )}
          {campuses.map((campus) => (
            <CheckRow
              key={campus._id}
              label={campus.shortName || campus.name}
              checked={selected.campuses.includes(campus._id)}
              onChange={() => onToggleCampus(campus._id)}
            />
          ))}
        </div>
      </Section>

      <Section title="Budget">
        <div className="px-1">
          <input
            type="range"
            min={BUDGET.min}
            max={BUDGET.max}
            step={BUDGET.step}
            value={budget}
            onChange={(event) => onBudget(Number(event.target.value))}
            className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-secondary-container"
          />
          <div className="flex justify-between mt-2 font-price-tabular text-[12px] text-on-surface-variant">
            <span>KSh {BUDGET.min.toLocaleString()}</span>
            <span className="text-primary">
              up to KSh {budget.toLocaleString()}
            </span>
          </div>
        </div>
      </Section>

      <Section title="Room Type">
        <div className="space-y-3">
          {ROOM_TYPE_OPTIONS.map((option) => (
            <CheckRow
              key={option.value}
              label={option.label}
              checked={selected.roomTypes.includes(option.value)}
              onChange={() => onToggleRoomType(option.value)}
            />
          ))}
        </div>
      </Section>

      <Section title="Amenities">
        <div className="space-y-3">
          {AMENITY_OPTIONS.map((amenity) => (
            <CheckRow
              key={amenity}
              label={amenity}
              checked={selected.amenities.includes(amenity)}
              onChange={() => onToggleAmenity(amenity)}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

// Five material-symbol stars, filled up to the rounded value.
export default function Stars({ value = 0, className = "" }) {
  const rounded = Math.round(value);
  return (
    <div className={`flex text-secondary-container ${className}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="material-symbols-outlined"
          style={{ fontVariationSettings: `'FILL' ${index < rounded ? 1 : 0}` }}
        >
          star
        </span>
      ))}
    </div>
  );
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop";

// Editorial gallery: one hero image + up to four thumbnails. Degrades
// gracefully when a listing has fewer images.
export default function ListingGallery({ images = [], title }) {
  const pics = images.length ? images : [FALLBACK_IMAGE];
  const hero = pics[0];
  const thumbs = pics.slice(1, 5);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-section-gap">
      <div className="lg:col-span-2 aspect-[1.5] overflow-hidden rounded-xl bg-surface-bone">
        <img
          src={hero}
          alt={title || "Listing"}
          className="w-full h-full object-cover"
        />
      </div>
      {thumbs.length > 0 && (
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {thumbs.map((src, index) => (
            <div
              key={index}
              className="aspect-square overflow-hidden rounded-xl bg-surface-bone"
            >
              <img
                src={src}
                alt={`${title || "Listing"} detail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import { categoryAverage, monthYear } from "../../Utils/listingHelpers";

const CATEGORY_LABELS = {
  cleanliness: "Cleanliness",
  security: "Security",
  maintenance: "Maintenance",
  amenities: "Amenities",
  water_availability: "Water",
  landlord_reliability: "Landlord",
};

function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <div className="flex text-secondary-container">
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

export default function CommunityFeedback({ building, reviews = [] }) {
  const average = building?.average_rating || 0;
  const categories = building?.categoryRatings || {};
  const hasRatings = Object.values(categories).some((v) => v > 0);

  return (
    <section className="mb-section-gap">
      <h3 className="font-headline-section text-[24px] text-primary lowercase mb-stack-lg">
        community feedback
      </h3>

      {!hasRatings && reviews.length === 0 ? (
        <p className="font-body-main text-slate-muted">
          No reviews yet — be the first to review this building.
        </p>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-12 items-start mb-12">
            <div className="flex flex-col items-center">
              <span className="text-[64px] font-display-hero text-secondary-container leading-none">
                {average.toFixed(1)}
              </span>
              <div className="mt-2">
                <Stars value={average} />
              </div>
            </div>

            <div className="flex-1 w-full space-y-3">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const value = categories[key] || 0;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <span className="font-label-eyebrow text-label-eyebrow w-24 uppercase">
                      {label}
                    </span>
                    <div className="flex-1 h-1.5 bg-surface-bone rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary-container"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-hairline">
            {reviews.length === 0 ? (
              <p className="font-body-main text-slate-muted py-stack-lg">
                No written reviews yet.
              </p>
            ) : (
              reviews.map((review) => {
                const rating = categoryAverage(review.categories);
                const author = review.isAnonymous
                  ? "anonymous resident"
                  : review.reviewer?.name || "resident";
                return (
                  <article
                    key={review._id}
                    className="py-stack-lg border-b border-hairline"
                  >
                    <div className="flex justify-between items-start mb-3 gap-4">
                      <div>
                        <p className="font-body-strong text-primary lowercase">
                          {author}
                        </p>
                        <p className="font-label-eyebrow text-label-eyebrow text-slate-muted">
                          {monthYear(review.createdAt)}
                        </p>
                      </div>
                      <div className="scale-75 origin-right">
                        <Stars value={rating} />
                      </div>
                    </div>
                    {review.title && (
                      <p className="font-body-strong text-primary mb-1">
                        {review.title}
                      </p>
                    )}
                    {review.comment && (
                      <p className="text-slate-muted italic">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}

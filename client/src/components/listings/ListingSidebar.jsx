import { useState } from "react";
import { toast } from "sonner";
import { initials } from "../../Utils/listingHelpers";

const STATUS_LABEL = {
  available: "AVAILABLE NOW",
  pending: "AVAILABILITY PENDING",
  unavailable: "CURRENTLY UNAVAILABLE",
};

export default function ListingSidebar({ listing }) {
  const landlord = listing?.createdBy;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  // NOTE: there is no enquiries endpoint yet — this is a front-end stub that
  // validates input and confirms. Wiring it to a real backend is a follow-up.
  const handleEnquire = (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your name.");
      return;
    }
    if (phone.trim().length < 7) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setName("");
      setPhone("");
      toast.success(
        `Enquiry sent! ${landlord?.name || "The landlord"} will reach out shortly.`,
      );
    }, 500);
  };

  const memberSince = landlord?.createdAt
    ? new Date(landlord.createdAt).getFullYear()
    : null;
  const isVerifiedLandlord = landlord?.verificationStatus === "verified";

  return (
    <div className="lg:col-span-4">
      <div className="sticky top-24 space-y-stack-lg">
        {/* Enquiry card */}
        <div className="bg-surface-container-lowest border border-hairline p-6 rounded-xl">
          <div className="mb-6">
            <p className="font-label-eyebrow text-label-eyebrow text-slate-muted mb-1 uppercase">
              Monthly Rent
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-section text-headline-section text-primary">
                KSh {listing?.price?.toLocaleString() ?? "—"}
              </span>
              <span className="font-body-main text-slate-muted">/ mo</span>
            </div>
            <p className="font-label-eyebrow text-label-eyebrow text-emerald-verified mt-2 flex items-center gap-1 uppercase">
              <span className="material-symbols-outlined text-sm">
                calendar_today
              </span>
              {STATUS_LABEL[listing?.status] || "AVAILABLE NOW"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleEnquire}>
            <div>
              <label className="font-label-eyebrow text-label-eyebrow text-slate-muted block mb-1 uppercase">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="your name"
                className="w-full border border-hairline focus:ring-1 focus:ring-secondary-container focus:border-secondary-container bg-surface-bright p-3 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="font-label-eyebrow text-label-eyebrow text-slate-muted block mb-1 uppercase">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+254..."
                className="w-full border border-hairline focus:ring-1 focus:ring-secondary-container focus:border-secondary-container bg-surface-bright p-3 rounded-lg text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-secondary-container text-honey-ink font-body-strong py-4 rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-60"
            >
              <span className="material-symbols-outlined">mail</span>
              {sending ? "sending…" : "enquire now"}
            </button>
            <button
              type="button"
              onClick={() => toast.info("Viewing scheduling is coming soon.")}
              className="w-full border border-hairline text-primary font-body-strong py-4 rounded-lg hover:bg-surface-bone transition-all"
            >
              schedule a viewing
            </button>
          </form>
        </div>

        {/* Landlord card */}
        {landlord && (
          <div className="bg-surface-bone p-6 rounded-xl border border-hairline">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-circle bg-primary-container flex items-center justify-center text-on-primary-container font-headline-section text-xl">
                {initials(landlord.name) || "BO"}
              </div>
              <div>
                <p className="font-body-strong text-primary lowercase">
                  {landlord.name}
                </p>
                {isVerifiedLandlord ? (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-verified font-bold uppercase tracking-wider">
                    <span
                      className="material-symbols-outlined text-[12px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                    verified {landlord.role || "landlord"}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-muted font-bold uppercase tracking-wider">
                    {landlord.role || "landlord"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {memberSince && (
                <span className="text-[10px] bg-surface-container-lowest border border-hairline px-2 py-1 rounded font-label-eyebrow text-primary">
                  MEMBER SINCE {memberSince}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

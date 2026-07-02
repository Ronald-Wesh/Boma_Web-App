import { useState } from "react";
import { toast } from "sonner";
import { initials } from "../../Utils/listingHelpers";
import { enquiryAPI } from "../../Utils/api";

const STATUS_LABEL = {
  available: "available now",
  pending: "availability pending",
  unavailable: "currently unavailable",
};

export default function ListingSidebar({ listing }) {
  const landlord = listing?.createdBy;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleEnquire = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your name.");
      return;
    }
    if (phone.trim().length < 7) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Please enter a short message.");
      return;
    }

    setSending(true);
    try {
      await enquiryAPI.create(listing._id, {
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });
      setName("");
      setPhone("");
      setMessage("");
      toast.success(
        `Enquiry sent! ${landlord?.name || "The landlord"} will reach out shortly.`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't send your enquiry");
    } finally {
      setSending(false);
    }
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
              {STATUS_LABEL[listing?.status] || "available now"}
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
            <div>
              <label className="font-label-eyebrow text-label-eyebrow text-slate-muted block mb-1 uppercase">
                Message
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="what would you like to ask?"
                className="w-full border border-hairline focus:ring-1 focus:ring-secondary-container focus:border-secondary-container bg-surface-bright p-3 rounded-lg text-sm outline-none resize-none"
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
                <span className="text-[10px] bg-surface-container-lowest border border-hairline px-2 py-1 rounded font-label-eyebrow text-primary uppercase">
                  member since {memberSince}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

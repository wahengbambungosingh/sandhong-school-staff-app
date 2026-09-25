import { useState } from "react";
import { Copy, Phone, Share2 } from "lucide-react";
import { Card, ErrorNote, Loading } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

const STATUSES = ["New", "Called", "Admitted", "Closed"];

function enquiryLink(schoolId) {
  return `${window.location.origin}${window.location.pathname}?enquiry=${schoolId}`;
}

export default function EnquiriesScreen({ user }) {
  const { loading, data, error, reload } = useAsync(() => api.listEnquiries());
  const [actionError, setActionError] = useState("");
  const link = enquiryLink(user.school.id);
  const share = () => {
    const text = `Admission enquiry for ${user.school.name}: ${link}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };
  async function setStatus(e, status) {
    setActionError("");
    try { await api.setEnquiryStatus(e.id, status); reload(); } catch (err) { setActionError(errorMessage(err)); }
  }
  return (
    <div className="p-4 space-y-3">
      <Card>
        <p className="text-xs text-gray-500 font-semibold">Public enquiry link</p>
        <p className="text-xs break-all mt-1" style={{ color: COLORS.header }}>{link}</p>
        <div className="flex gap-2 mt-2">
          <button onClick={() => navigator.clipboard?.writeText(link)} className="flex items-center gap-1 text-xs font-bold rounded-xl px-3 py-2" style={{ background: COLORS.card, color: COLORS.header }}><Copy size={14} /> Copy</button>
          <button onClick={share} className="flex items-center gap-1 text-xs font-bold rounded-xl px-3 py-2" style={{ background: COLORS.card, color: COLORS.header }}><Share2 size={14} /> Share</button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">Put this on posters or WhatsApp. Anyone can fill the form; no login needed.</p>
      </Card>
      <ErrorNote message={(error && errorMessage(error)) || actionError} onRetry={error ? reload : undefined} />
      {loading && <Loading />}
      {!loading && data?.length === 0 && <p className="text-sm text-gray-500 px-1">No enquiries yet.</p>}
      {(data || []).map((e) => (
        <Card key={e.id}>
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-bold" style={{ color: COLORS.ink }}>{e.childName}{e.childAge && <span className="text-xs text-gray-500 font-semibold"> · age {e.childAge}</span>}</p>
              <p className="text-xs text-gray-500">{e.classWanted ? `Wants ${e.classWanted} · ` : ""}{e.date}</p>
            </div>
            <select aria-label={`Status for ${e.childName}`} value={e.status} onChange={(ev) => setStatus(e, ev.target.value)} className="rounded-full px-2 py-1 text-xs font-bold border-2 bg-white shrink-0" style={fieldStyle}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <p className="text-sm mt-2">{e.parentName}</p>
          <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 text-sm font-bold mt-1" style={{ color: COLORS.header }}><Phone size={14} /> {e.phone}</a>
          {e.note && <p className="text-sm text-gray-600 mt-1">{e.note}</p>}
        </Card>
      ))}
    </div>
  );
}

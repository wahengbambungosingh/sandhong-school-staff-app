import { useState } from "react";
import { BigButton, ErrorNote, Loading, TextInput } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";
import { AuthShell } from "./LoginScreen.jsx";

/** Public admission enquiry form, opened from a link the school shares. */
export default function EnquiryScreen({ schoolId }) {
  const school = useAsync(() => api.getEnquirySchoolName(schoolId), [schoolId]);
  const [f, setF] = useState({ childName: "", childAge: "", classWanted: "", parentName: "", phone: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (f.phone.replace(/\D/g, "").length < 10) throw new Error("Please enter a 10-digit mobile number.");
      await api.submitEnquiry(schoolId, f); setDone(true);
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  if (school.loading) return <AuthShell title="Admission enquiry" subtitle=""><Loading /></AuthShell>;
  if (school.error || !school.data) return <AuthShell title="Admission enquiry" subtitle=""><ErrorNote message="This enquiry link is not valid. Please ask the school for a new one." /></AuthShell>;

  return (
    <AuthShell title="Admission enquiry" subtitle={school.data}>
      {done ? (
        <div className="space-y-3 text-center">
          <p className="text-lg font-bold" style={{ color: COLORS.ink }}>Thank you</p>
          <p className="text-sm text-gray-600">The school office has your enquiry and will call you on {f.phone}.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <TextInput id="enq-child" label="Child's name" required value={f.childName} onChange={set("childName")} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput id="enq-age" label="Child's age" inputMode="numeric" value={f.childAge} onChange={set("childAge")} />
            <TextInput id="enq-class" label="Class wanted" placeholder="e.g. LKG" value={f.classWanted} onChange={set("classWanted")} />
          </div>
          <TextInput id="enq-parent" label="Your name" required value={f.parentName} onChange={set("parentName")} />
          <TextInput id="enq-phone" label="Your mobile number" type="tel" inputMode="numeric" required value={f.phone} onChange={set("phone")} />
          <label className="block" htmlFor="enq-note">
            <span className="block text-xs font-bold mb-1" style={{ color: COLORS.ink }}>Anything else (optional)</span>
            <textarea id="enq-note" value={f.note} onChange={set("note")} className={`w-full ${fieldClass} h-20`} style={fieldStyle} />
          </label>
          <ErrorNote message={error} />
          <BigButton type="submit" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</BigButton>
        </form>
      )}
    </AuthShell>
  );
}

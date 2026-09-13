import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Plus, X } from "lucide-react";
import { BigButton, Card, ErrorNote, Loading, SelectInput, StatusPill } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { ISSUE_CATEGORIES } from "../data/dummy.js";
import { api } from "../lib/api.js";
import { compressImage } from "../lib/image.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, MANAGEMENT_ROLES } from "../lib/shared.js";

const STATUSES = ["Open", "In Progress", "Resolved"];

function PhotoPicker({ photo, onChange }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    try {
      const blob = await compressImage(file);
      onChange({ blob, url: URL.createObjectURL(blob) });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (photo) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2" style={fieldStyle}>
        <img src={photo.url} alt="Facility photo" className="w-full max-h-64 object-cover block" />
        <button type="button" onClick={() => onChange(null)} aria-label="Remove photo"
          className="absolute top-2 right-2 rounded-full p-1.5 text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed p-3" style={fieldStyle}>
      <p className="text-xs font-bold text-gray-500 mb-2 text-center">Facility photo (optional)</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold" style={{ background: COLORS.card, color: COLORS.header }}>
          <Camera size={18} /> Take photo
        </button>
        <button type="button" onClick={() => galleryRef.current?.click()} disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold" style={{ background: COLORS.card, color: COLORS.header }}>
          <ImageIcon size={18} /> Choose from gallery
        </button>
      </div>
      {busy && <p className="text-xs text-gray-500 text-center mt-2">Preparing photo…</p>}
      <ErrorNote message={error} />
      {/* capture="environment" opens the rear camera on phones; the other input opens the gallery / file picker */}
      <input ref={cameraRef} id="issue-photo-camera" type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      <input ref={galleryRef} id="issue-photo-gallery" type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  );
}

function IssueForm({ onSaved, onCancel }) {
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("Low");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.addIssue({ category, desc, priority, photo: photo?.blob || null });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Card className="space-y-3">
        <SelectInput id="issue-category" label="Category" options={ISSUE_CATEGORIES} value={category} onChange={(e) => setCategory(e.target.value)} />
        <label className="block" htmlFor="issue-desc">
          <span className="block text-xs font-bold mb-1" style={{ color: COLORS.ink }}>Describe the issue</span>
          <textarea id="issue-desc" required placeholder="What is wrong, and where?" value={desc} onChange={(e) => setDesc(e.target.value)}
            className={`w-full ${fieldClass} h-20`} style={fieldStyle} />
        </label>
        <SelectInput id="issue-priority" label="Priority" options={["Low", "Medium", "High"]} value={priority} onChange={(e) => setPriority(e.target.value)} />
        <PhotoPicker photo={photo} onChange={setPhoto} />
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? (photo ? "Uploading photo…" : "Saving…") : "Submit issue"}</BigButton>
        <button type="button" onClick={onCancel} className="w-full text-sm font-semibold text-gray-500 py-2">Cancel</button>
      </Card>
    </form>
  );
}

export default function IssuesScreen({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [statusError, setStatusError] = useState("");
  const { loading, data, error, reload } = useAsync(() => api.listIssues());
  const canManage = MANAGEMENT_ROLES.includes(user?.role);

  async function changeStatus(issue, status) {
    setStatusError("");
    try { await api.updateIssueStatus(issue.id, status); reload(); }
    catch (err) { setStatusError(errorMessage(err)); }
  }

  if (viewPhoto) {
    return (
      <div className="p-4 space-y-3">
        <button onClick={() => setViewPhoto(null)} className="text-sm font-semibold" style={{ color: COLORS.header }}>‹ Back to issues</button>
        <img src={viewPhoto} alt="Facility photo" className="w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {showForm ? (
        <IssueForm onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); reload(); }} />
      ) : (
        <BigButton icon={Plus} onClick={() => setShowForm(true)}>Report an issue</BigButton>
      )}
      <ErrorNote message={(error && errorMessage(error)) || statusError} onRetry={error ? reload : undefined} />
      {loading && <Loading />}
      {!loading && !error && data?.length === 0 && <p className="text-sm text-gray-500 px-1">No issues reported yet.</p>}
      {(data || []).map((i) => (
        <Card key={i.id}>
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{i.category}</p>
            {canManage ? (
              <select aria-label="Status" value={i.status} onChange={(e) => changeStatus(i, e.target.value)}
                className="rounded-full px-2 py-1 text-xs font-bold border-2 bg-white" style={fieldStyle}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            ) : <StatusPill status={i.status} />}
          </div>
          <p className="text-sm text-gray-700 mt-1">{i.desc}</p>
          {i.photoUrl && (
            <button type="button" onClick={() => setViewPhoto(i.photoUrl)} className="block mt-2 w-full">
              <img src={i.photoUrl} alt="" className="w-full h-40 object-cover rounded-xl" loading="lazy" />
            </button>
          )}
          <div className="flex items-center justify-between mt-2">
            <StatusPill status={i.priority} />
            <span className="text-xs text-gray-400">{i.date}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

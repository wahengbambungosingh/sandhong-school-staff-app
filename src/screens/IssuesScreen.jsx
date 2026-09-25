import { useState } from "react";
import { Plus } from "lucide-react";
import { BigButton, Card, ErrorNote, Loading, SelectInput, StatusPill } from "../components/ui.jsx";
import FilePicker from "../components/FilePicker.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { ISSUE_CATEGORIES } from "../data/dummy.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, MANAGEMENT_ROLES } from "../lib/shared.js";

const STATUSES = ["Open", "In Progress", "Resolved"];

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
        <FilePicker idPrefix="issue-photo" label="Facility photo (optional)" allowPdf={false} value={photo} onChange={setPhoto} />
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

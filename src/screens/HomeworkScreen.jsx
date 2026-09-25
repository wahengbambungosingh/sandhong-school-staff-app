import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { BigButton, Card, ErrorNote, Loading, SelectInput, TextInput } from "../components/ui.jsx";
import FilePicker from "../components/FilePicker.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, todayISO } from "../lib/shared.js";

export default function HomeworkScreen({ user }) {
  const { classes, sections, subjects } = user.school;
  const [showForm, setShowForm] = useState(false);
  const [filterCls, setFilterCls] = useState("All");
  const [form, setForm] = useState({ cls: classes[0] || "", sec: sections[0] || "", subject: subjects[0] || "", text: "", due: "" });
  const [file, setFile] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { loading, data, error: loadError, reload } = useAsync(() => api.listHomework());
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await api.addHomework({ ...form, file }); setForm({ ...form, text: "", due: "" }); setFile(null); setShowForm(false); reload(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function remove(h) {
    if (!window.confirm("Delete this homework?")) return;
    try { await api.removeHomework(h.id); reload(); } catch (err) { setError(errorMessage(err)); }
  }

  const list = (data || []).filter((h) => filterCls === "All" || h.cls === filterCls);

  if (viewImage) {
    return (
      <div className="p-4 space-y-3">
        <button onClick={() => setViewImage(null)} className="text-sm font-semibold" style={{ color: COLORS.header }}>‹ Back to homework</button>
        <img src={viewImage} alt="Homework attachment" className="w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <BigButton icon={Plus} onClick={() => setShowForm(!showForm)}>{showForm ? "Close form" : "Set new homework"}</BigButton>
      {showForm && (
        <form onSubmit={submit}>
          <Card className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <SelectInput id="hw-cls" label="Class" options={classes} value={form.cls} onChange={set("cls")} />
              <SelectInput id="hw-sec" label="Section" options={sections.map((s) => [s, `Section ${s}`])} value={form.sec} onChange={set("sec")} />
            </div>
            <SelectInput id="hw-subject" label="Subject" options={subjects} value={form.subject} onChange={set("subject")} />
            <label className="block" htmlFor="hw-text">
              <span className="block text-xs font-bold mb-1" style={{ color: COLORS.ink }}>Homework</span>
              <textarea id="hw-text" required placeholder="What should the students do?" value={form.text} onChange={set("text")} className={`w-full ${fieldClass} h-24`} style={fieldStyle} />
            </label>
            <TextInput id="hw-due" label="Due date (optional)" type="date" min={todayISO()} value={form.due} onChange={set("due")} />
            <FilePicker idPrefix="hw-file" label="Attach a worksheet photo or PDF (optional)" value={file} onChange={setFile} />
            <ErrorNote message={error} />
            <BigButton type="submit" disabled={busy}>{busy ? (file ? "Uploading…" : "Saving…") : "Save homework"}</BigButton>
          </Card>
        </form>
      )}
      <select aria-label="Filter by class" value={filterCls} onChange={(e) => setFilterCls(e.target.value)} className="w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold bg-white" style={fieldStyle}>
        <option>All</option>
        {classes.map((c) => <option key={c}>{c}</option>)}
      </select>
      <ErrorNote message={loadError && errorMessage(loadError)} onRetry={reload} />
      {loading && <Loading />}
      {!loading && list.length === 0 && <p className="text-sm text-gray-500 px-1">No homework set yet.</p>}
      {list.map((h) => (
        <Card key={h.id}>
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{h.cls} {h.sec} · {h.subject}</p>
            <div className="flex items-center gap-2 shrink-0">
              {h.due && <span className="text-xs text-gray-400">Due {h.due}</span>}
              <button onClick={() => remove(h)} aria-label="Delete homework" className="p-1 text-gray-400"><Trash2 size={14} /></button>
            </div>
          </div>
          <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">{h.text}</p>
          {h.attachment && h.attachment.type === "application/pdf" && (
            <a href={h.attachment.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold" style={{ background: COLORS.card, color: COLORS.header }}>
              <FileText size={16} /> <span className="truncate">{h.attachment.name}</span>
            </a>
          )}
          {h.attachment && h.attachment.type !== "application/pdf" && (
            <button type="button" onClick={() => setViewImage(h.attachment.url)} className="block mt-2 w-full">
              <img src={h.attachment.url} alt="" className="w-full h-40 object-cover rounded-xl" loading="lazy" />
            </button>
          )}
          {h.by && <p className="text-[11px] text-gray-400 mt-1">Set by {h.by}</p>}
        </Card>
      ))}
    </div>
  );
}

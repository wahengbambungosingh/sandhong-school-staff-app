import { useState } from "react";
import { Card, ErrorNote, Loading } from "../components/ui.jsx";
import { COLORS } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

export default function CorrectionsScreen() {
  const { loading, data, error, reload } = useAsync(() => api.listCorrections());
  const [actionError, setActionError] = useState("");
  async function toggle(c) {
    setActionError("");
    try { await api.setCorrectionStatus(c.id, c.status === "Done" ? "New" : "Done"); reload(); } catch (err) { setActionError(errorMessage(err)); }
  }
  const open = (data || []).filter((c) => c.status !== "Done");
  const done = (data || []).filter((c) => c.status === "Done");
  const Row = ({ c }) => (
    <Card>
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{c.studentName}</p>
          <p className="text-xs text-gray-500">{c.cls} {c.sec} · {c.date}</p>
        </div>
        <button onClick={() => toggle(c)} className="text-xs font-bold rounded-full px-3 py-1" style={c.status === "Done" ? { background: "#DCEFE1", color: "#1F6B3B" } : { background: COLORS.accent, color: COLORS.ink }}>
          {c.status === "Done" ? "Done ✓" : "Mark done"}
        </button>
      </div>
      <p className="text-sm mt-2">{c.message}</p>
    </Card>
  );
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-gray-500 px-1">Parents send these from their child's details page. Update the student record, then mark it done.</p>
      <ErrorNote message={(error && errorMessage(error)) || actionError} onRetry={error ? reload : undefined} />
      {loading && <Loading />}
      {!loading && data?.length === 0 && <p className="text-sm text-gray-500 px-1">No requests from parents.</p>}
      {open.map((c) => <Row key={c.id} c={c} />)}
      {done.length > 0 && <p className="font-bold text-sm px-1 pt-2" style={{ color: COLORS.ink }}>Done</p>}
      {done.map((c) => <Row key={c.id} c={c} />)}
    </div>
  );
}

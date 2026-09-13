import { useState } from "react";
import { Card, ErrorNote, Loading, StatusPill } from "../components/ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { CLASSES } from "../data/dummy.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage } from "../lib/shared.js";

export default function FeesScreen() {
  const [filterCls, setFilterCls] = useState("All");
  const { loading, data, error, reload } = useAsync(() => api.listStudents());
  const list = (data || []).filter((s) => s.active && (filterCls === "All" || s.cls === filterCls));
  const paidCount = list.filter((s) => s.fee === "Paid").length;
  const pendingCount = list.filter((s) => s.fee === "Pending").length;

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="text-xs text-gray-500 font-semibold">Paid</p><p className="text-3xl font-bold" style={{ color: "#1F6B3B" }}>{paidCount}</p></Card>
        <Card><p className="text-xs text-gray-500 font-semibold">Pending</p><p className="text-3xl font-bold" style={{ color: "#93650F" }}>{pendingCount}</p></Card>
      </div>
      <select aria-label="Filter by class" value={filterCls} onChange={(e) => setFilterCls(e.target.value)} className="w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold bg-white" style={fieldStyle}>
        <option>All</option>
        {CLASSES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {list.map((s) => (
        <Card key={s.id} className="flex items-center justify-between">
          <div>
            <p className="font-bold" style={{ color: COLORS.ink }}>{s.name}</p>
            <p className="text-xs text-gray-500">{s.adm} · {s.cls} {s.sec}</p>
          </div>
          <StatusPill status={s.fee} />
        </Card>
      ))}
      <p className="text-xs text-gray-500 px-1">Change a student's fee status from their page in the Student Register.</p>
    </div>
  );
}

import { useMemo, useState } from "react";
import { BookOpen, CalendarCheck, ChevronLeft, ChevronRight, ClipboardList, FileText, IndianRupee, LogOut, Plus, UserRound } from "lucide-react";
import { BackLink, BigButton, Card, ErrorNote, Loading, StatusPill, TextInput, Tile, TopBar } from "../components/ui.jsx";
import { COLORS, fieldClass, fieldStyle } from "../theme.js";
import { api } from "../lib/api.js";
import { useAsync } from "../lib/useAsync.js";
import { errorMessage, formatDate, todayISO } from "../lib/shared.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATUS_COLORS = { Present: "#DCEFE1", Absent: "#FBE4E1", Late: "#FCEFD9", Leave: "#E6E9F5" };
const STATUS_INK = { Present: "#1F6B3B", Absent: "#B23A2B", Late: "#93650F", Leave: "#38408A" };

function ChildPicker({ children, value, onChange }) {
  if (children.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {children.map((c) => (
        <button key={c.id} onClick={() => onChange(c.id)} className="rounded-full px-4 py-2 text-sm font-bold border-2 shrink-0"
          style={c.id === value ? { background: COLORS.accent, borderColor: COLORS.accent, color: COLORS.ink } : { background: "#fff", borderColor: COLORS.border, color: COLORS.ink }}>
          {c.name}
        </button>
      ))}
    </div>
  );
}

function AddChild({ onDone, onCancel, first }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { await api.addChild(phone, code); onDone(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="p-4 space-y-3">
      <Card className="space-y-3">
        <p className="font-bold" style={{ color: COLORS.ink }}>{first ? "Add your child" : "Add another child"}</p>
        <TextInput id="add-phone" label="Your mobile number" type="tel" inputMode="numeric" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        <TextInput id="add-code" label="Child code from the school" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <ErrorNote message={error} />
        <BigButton type="submit" disabled={busy}>{busy ? "Please wait…" : "Add child"}</BigButton>
        {!first && <button type="button" onClick={onCancel} className="w-full text-sm font-semibold text-gray-500 py-2">Cancel</button>}
      </Card>
    </form>
  );
}

function Home({ children, nav }) {
  const today = todayISO();
  const rows = useAsync(async () => {
    const out = {};
    for (const c of children) {
      const [att, hw] = await Promise.all([api.getChildAttendance(c.id, today, today), api.listChildHomework(c)]);
      out[c.id] = { today: att[today] || null, nextHomework: hw[0] || null };
    }
    return out;
  }, [children.map((c) => c.id).join(",")]);
  return (
    <div className="p-4 space-y-4">
      <ErrorNote message={rows.error && errorMessage(rows.error)} onRetry={rows.reload} />
      {children.map((c) => {
        const r = rows.data?.[c.id];
        return (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold" style={{ color: COLORS.ink }}>{c.name}</p>
                <p className="text-xs text-gray-500">{c.cls} · Section {c.sec} · {c.schoolName}</p>
              </div>
              {r ? (r.today ? <StatusPill status={r.today} /> : <span className="text-xs text-gray-400 font-semibold">Not marked today</span>) : <span className="text-xs text-gray-400">…</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div className="rounded-xl p-2" style={{ background: COLORS.bg }}>
                <p className="text-[11px] text-gray-500 font-semibold">Latest homework</p>
                <p className="font-semibold truncate">{r ? (r.nextHomework ? `${r.nextHomework.subject}${r.nextHomework.due ? ` · due ${r.nextHomework.due}` : ""}` : "None yet") : "…"}</p>
              </div>
              <div className="rounded-xl p-2" style={{ background: COLORS.bg }}>
                <p className="text-[11px] text-gray-500 font-semibold">Fees</p>
                <p className="font-semibold">{c.fee}</p>
              </div>
            </div>
          </Card>
        );
      })}
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={CalendarCheck} label="Attendance" onClick={() => nav("attendance")} />
        <Tile icon={BookOpen} label="Homework" onClick={() => nav("homework")} />
        <Tile icon={ClipboardList} label="Marks" onClick={() => nav("marks")} />
        <Tile icon={IndianRupee} label="Fees" onClick={() => nav("fees")} />
        <Tile icon={UserRound} label="Child's details" onClick={() => nav("profile")} />
        <Tile icon={Plus} label="Add another child" onClick={() => nav("add")} />
      </div>
    </div>
  );
}

function Attendance({ child }) {
  const [ym, setYm] = useState(todayISO().slice(0, 7));
  const [y, m] = ym.split("-").map(Number);
  const from = `${ym}-01`;
  const daysInMonth = new Date(y, m, 0).getDate();
  const to = `${ym}-${String(daysInMonth).padStart(2, "0")}`;
  const { loading, data, error, reload } = useAsync(() => api.getChildAttendance(child.id, from, to), [child.id, ym]);
  const counts = useMemo(() => { const c = { Present: 0, Absent: 0, Late: 0, Leave: 0 }; Object.values(data || {}).forEach((s) => { if (c[s] != null) c[s]++; }); return c; }, [data]);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const shift = (d) => { const n = new Date(y, m - 1 + d, 1); setYm(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`); };
  const isCurrent = ym === todayISO().slice(0, 7);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="p-2 rounded-full" style={{ background: COLORS.card }}><ChevronLeft size={18} /></button>
        <p className="font-bold" style={{ color: COLORS.ink }}>{MONTHS[m - 1]} {y}</p>
        <button onClick={() => shift(1)} disabled={isCurrent} aria-label="Next month" className="p-2 rounded-full disabled:opacity-30" style={{ background: COLORS.card }}><ChevronRight size={18} /></button>
      </div>
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {data && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="rounded-xl p-2 text-center" style={{ background: STATUS_COLORS[k] }}>
                <p className="text-xl font-bold" style={{ color: STATUS_INK[k] }}>{v}</p>
                <p className="text-[11px] font-semibold" style={{ color: STATUS_INK[k] }}>{k}</p>
              </div>
            ))}
          </div>
          <Card>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow }).map((_, i) => <span key={`b${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const iso = `${ym}-${String(i + 1).padStart(2, "0")}`;
                const st = data[iso];
                return (
                  <div key={iso} title={st ? `${formatDate(iso)}: ${st}` : ""} className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: st ? STATUS_COLORS[st] : "#F3F1EA", color: st ? STATUS_INK[st] : "#B5B2A6" }}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </Card>
          <p className="text-xs text-gray-500 px-1">Days without a colour were not marked (holidays, weekends, or before the school started using the app).</p>
        </>
      )}
    </div>
  );
}

function Homework({ child }) {
  const [viewImage, setViewImage] = useState(null);
  const { loading, data, error, reload } = useAsync(() => api.listChildHomework(child), [child.id]);
  if (viewImage) return (
    <div className="p-4 space-y-3"><BackLink onClick={() => setViewImage(null)}>Back to homework</BackLink><img src={viewImage} alt="Homework attachment" className="w-full rounded-2xl" /></div>
  );
  return (
    <div className="p-4 space-y-3">
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {!loading && data?.length === 0 && <p className="text-sm text-gray-500 px-1">No homework set for {child.cls} {child.sec} yet.</p>}
      {(data || []).map((h) => (
        <Card key={h.id}>
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-sm" style={{ color: COLORS.ink }}>{h.subject}</p>
            {h.due && <span className="text-xs text-gray-400 shrink-0">Due {h.due}</span>}
          </div>
          <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">{h.text}</p>
          {h.attachment?.type === "application/pdf" && (
            <a href={h.attachment.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold" style={{ background: COLORS.card, color: COLORS.header }}>
              <FileText size={16} /> <span className="truncate">{h.attachment.name}</span>
            </a>
          )}
          {h.attachment && h.attachment.type !== "application/pdf" && (
            <button type="button" onClick={() => setViewImage(h.attachment.url)} className="block mt-2 w-full">
              <img src={h.attachment.url} alt="" className="w-full h-40 object-cover rounded-xl" loading="lazy" />
            </button>
          )}
        </Card>
      ))}
    </div>
  );
}

function Marks({ child }) {
  const { loading, data, error, reload } = useAsync(() => api.listChildMarks(child), [child.id]);
  return (
    <div className="p-4 space-y-3">
      <ErrorNote message={error && errorMessage(error)} onRetry={reload} />
      {loading && <Loading />}
      {!loading && data?.length === 0 && <p className="text-sm text-gray-500 px-1">No tests recorded for {child.cls} {child.sec} yet.</p>}
      {(data || []).map((a) => {
        const low = a.mark != null && a.mark / a.max < 0.4;
        return (
          <Card key={a.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: COLORS.ink }}>{a.title}</p>
              <p className="text-xs text-gray-500">{a.subject} · {a.date}</p>
            </div>
            <p className="text-lg font-bold shrink-0" style={{ color: a.mark == null ? "#B5B2A6" : low ? COLORS.alert : COLORS.header }}>
              {a.mark == null ? "—" : a.mark}<span className="text-xs text-gray-400 font-semibold"> / {a.max}</span>
            </p>
          </Card>
        );
      })}
      {!loading && data?.some((a) => a.mark == null) && <p className="text-xs text-gray-500 px-1">A dash means the mark has not been entered yet.</p>}
    </div>
  );
}

function Fees({ children }) {
  return (
    <div className="p-4 space-y-3">
      {children.map((c) => (
        <Card key={c.id} className="flex items-center justify-between">
          <div><p className="font-bold" style={{ color: COLORS.ink }}>{c.name}</p><p className="text-xs text-gray-500">{c.cls} {c.sec}</p></div>
          <StatusPill status={c.fee} />
        </Card>
      ))}
      <p className="text-xs text-gray-500 px-1">For amounts and how to pay, please contact the school office.</p>
    </div>
  );
}

function Profile({ child, onRemoved }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const mine = useAsync(() => api.listMyCorrections(), [child.id]);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(""); setSent(false);
    try { await api.submitCorrection(child, message); setMessage(""); setSent(true); mine.reload(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  const rows = (mine.data || []).filter((r) => r.studentId === child.id);
  return (
    <div className="p-4 space-y-3">
      <Card className="space-y-1">
        <p className="text-xl font-bold" style={{ color: COLORS.ink }}>{child.name}</p>
        <p className="text-sm text-gray-500">Admission No. {child.adm}</p>
        <p className="text-sm">{child.cls} · Section {child.sec}</p>
        <p className="text-sm">{child.schoolName}</p>
        <div className="h-px bg-gray-100 my-2" />
        <p className="text-sm"><span className="text-gray-500">Guardian:</span> {child.guardian || "—"}</p>
        <p className="text-sm"><span className="text-gray-500">Phone:</span> {child.phone || "—"}</p>
        <p className="text-sm"><span className="text-gray-500">Address:</span> {child.village || "—"}</p>
        <p className="text-sm"><span className="text-gray-500">WhatsApp messages:</span> {child.consent ? "Allowed" : "Not allowed"}</p>
      </Card>
      <form onSubmit={submit}>
        <Card className="space-y-2">
          <p className="font-bold text-sm" style={{ color: COLORS.ink }}>Something wrong? Ask the office to correct it</p>
          <textarea id="correction-message" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Our phone number changed to 99000 12345" className={`w-full ${fieldClass} h-20`} style={fieldStyle} />
          <ErrorNote message={error} />
          {sent && <p className="text-sm rounded-xl px-3 py-2" style={{ background: "#DCEFE1", color: "#1F6B3B" }}>Sent to the school office.</p>}
          <BigButton type="submit" disabled={busy}>{busy ? "Sending…" : "Send request"}</BigButton>
        </Card>
      </form>
      {rows.length > 0 && (
        <Card>
          <p className="font-bold text-sm mb-2" style={{ color: COLORS.ink }}>Your requests</p>
          {rows.map((r) => (
            <div key={r.id} className="py-2 border-t first:border-t-0 flex justify-between gap-2 text-sm" style={{ borderColor: "#EEE" }}>
              <span className="flex-1">{r.message}</span>
              <span className="text-xs font-bold shrink-0" style={{ color: r.status === "Done" ? "#1F6B3B" : "#93650F" }}>{r.status === "Done" ? "Done" : "Pending"} · {r.date}</span>
            </div>
          ))}
        </Card>
      )}
      <button onClick={() => { if (window.confirm(`Remove ${child.name} from this phone? You can add them again with the child code.`)) api.removeChild(child.id).then(onRemoved); }}
        className="w-full text-sm font-semibold text-gray-400 py-2">Remove this child from my phone</button>
    </div>
  );
}

const TITLES = { attendance: "Attendance", homework: "Homework", marks: "Marks", fees: "Fees", profile: "Child's details", add: "Add child" };

export default function ParentApp({ user }) {
  const children = user.children || [];
  const [screen, setScreen] = useState("home");
  const [childId, setChildId] = useState(children[0]?.id || null);
  const child = children.find((c) => c.id === childId) || children[0] || null;
  const nav = (s) => { setScreen(s); window.scrollTo(0, 0); };

  if (children.length === 0) {
    return (
      <div className="min-h-screen max-w-md mx-auto" style={{ background: COLORS.bg }}>
        <TopBar title="Parents" schoolName="Parents" />
        <AddChild first onDone={() => nav("home")} />
        <div className="p-4 pt-0"><button onClick={() => api.signOut()} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 py-3"><LogOut size={14} /> Sign out</button></div>
      </div>
    );
  }

  let body;
  switch (screen) {
    case "attendance": body = <Attendance child={child} />; break;
    case "homework": body = <Homework child={child} />; break;
    case "marks": body = <Marks child={child} />; break;
    case "fees": body = <Fees children={children} />; break;
    case "profile": body = <Profile child={child} onRemoved={() => nav("home")} />; break;
    case "add": body = <AddChild onDone={() => nav("home")} onCancel={() => nav("home")} />; break;
    default: body = <Home children={children} nav={nav} />;
  }
  const showPicker = ["attendance", "homework", "marks", "profile"].includes(screen);

  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ background: COLORS.bg }}>
      <TopBar title={screen === "home" ? "My children" : TITLES[screen]} onBack={screen === "home" ? null : () => nav("home")} role="Parent" schoolName={child?.schoolName} />
      {showPicker && <div className="px-4 pt-4"><ChildPicker children={children} value={child?.id} onChange={setChildId} /></div>}
      {body}
      <div className="p-4 pt-0 print:hidden">
        <button onClick={() => api.signOut()} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 py-3"><LogOut size={14} /> Sign out</button>
      </div>
    </div>
  );
}

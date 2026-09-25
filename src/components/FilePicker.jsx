import { useRef, useState } from "react";
import { Camera, FileText, Image as ImageIcon, X } from "lucide-react";
import { ErrorNote } from "./ui.jsx";
import { COLORS, fieldStyle } from "../theme.js";
import { compressImage } from "../lib/image.js";
import { errorMessage } from "../lib/shared.js";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Lets the person attach one photo (camera or gallery) or one PDF.
 * `value` is null or { blob, name, type, url }.
 */
export default function FilePicker({ value, onChange, label = "Attachment (optional)", allowPdf = true, idPrefix = "file" }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const pdfRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    try {
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        if (!allowPdf) throw new Error("Please choose an image.");
        if (file.size > MAX_PDF_BYTES) throw new Error("PDF is too large. Keep it under 10 MB.");
        onChange({ blob: file, name: file.name, type: "application/pdf", url: URL.createObjectURL(file) });
      } else if (file.type.startsWith("image/")) {
        const blob = await compressImage(file);
        onChange({ blob, name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg", url: URL.createObjectURL(blob) });
      } else {
        throw new Error("Please choose a photo or a PDF.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2" style={fieldStyle}>
        {value.type === "application/pdf" ? (
          <div className="flex items-center gap-3 p-3">
            <FileText size={28} style={{ color: COLORS.header }} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>{value.name}</p>
              <p className="text-xs text-gray-500">PDF · {(value.blob.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>
        ) : (
          <img src={value.url} alt="Attached photo" className="w-full max-h-64 object-cover block" />
        )}
        <button type="button" onClick={() => onChange(null)} aria-label="Remove attachment"
          className="absolute top-2 right-2 rounded-full p-1.5 text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
          <X size={16} />
        </button>
      </div>
    );
  }

  const btn = "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold";
  return (
    <div className="rounded-xl border-2 border-dashed p-3" style={fieldStyle}>
      <p className="text-xs font-bold text-gray-500 mb-2 text-center">{label}</p>
      <div className={`grid gap-2 ${allowPdf ? "grid-cols-3" : "grid-cols-2"}`}>
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={busy} className={btn} style={{ background: COLORS.card, color: COLORS.header }}>
          <Camera size={18} /> Camera
        </button>
        <button type="button" onClick={() => galleryRef.current?.click()} disabled={busy} className={btn} style={{ background: COLORS.card, color: COLORS.header }}>
          <ImageIcon size={18} /> Gallery
        </button>
        {allowPdf && (
          <button type="button" onClick={() => pdfRef.current?.click()} disabled={busy} className={btn} style={{ background: COLORS.card, color: COLORS.header }}>
            <FileText size={18} /> PDF
          </button>
        )}
      </div>
      {busy && <p className="text-xs text-gray-500 text-center mt-2">Preparing file…</p>}
      <ErrorNote message={error} />
      <input ref={cameraRef} id={`${idPrefix}-camera`} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      <input ref={galleryRef} id={`${idPrefix}-gallery`} type="file" accept="image/*" onChange={pick} className="hidden" />
      {allowPdf && <input ref={pdfRef} id={`${idPrefix}-pdf`} type="file" accept="application/pdf,.pdf" onChange={pick} className="hidden" />}
    </div>
  );
}

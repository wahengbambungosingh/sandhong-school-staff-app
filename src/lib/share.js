// Sharing homework to WhatsApp. Nothing is sent automatically: the phone's
// share sheet (or WhatsApp itself) opens and the teacher picks the chat.

export function buildHomeworkMessage(h, schoolName) {
  const lines = [
    `📚 Homework · ${schoolName}`,
    `${h.cls} ${h.sec} · ${h.subject}`,
    "",
    h.text,
  ];
  if (h.due) lines.push("", `Due: ${h.due}`);
  return lines.join("\n");
}

async function fetchAsFile(url, name, type) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load the attachment.");
  const blob = await res.blob();
  return new File([blob], name, { type: type || blob.type });
}

/**
 * Share one homework. Prefers the phone's share sheet with the real file
 * attached; falls back to opening WhatsApp with the text and a link that
 * stays valid for 7 days.
 */
export async function shareHomework(h, schoolName, getShareUrl) {
  let text = buildHomeworkMessage(h, schoolName);

  if (h.attachment && typeof navigator.share === "function") {
    try {
      const file = await fetchAsFile(h.attachment.url, h.attachment.name, h.attachment.type);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text, files: [file] });
        return "shared";
      }
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
      // fall through to the link-based method
    }
  }

  if (h.attachment) {
    const url = await getShareUrl(h);
    if (url) text += `\n\n${h.attachment.type === "application/pdf" ? "Worksheet (PDF)" : "Photo"}: ${url}\n(link works for 7 days)`;
  }

  if (typeof navigator.share === "function" && !h.attachment) {
    try { await navigator.share({ text }); return "shared"; }
    catch (err) { if (err?.name === "AbortError") return "cancelled"; }
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  return "opened";
}

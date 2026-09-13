/** Shrink a photo from the camera or gallery to a phone-friendly JPEG. */
export async function compressImage(file, maxSide = 1280, quality = 0.8) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // browser could not decode it; upload as-is
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob || file;
}

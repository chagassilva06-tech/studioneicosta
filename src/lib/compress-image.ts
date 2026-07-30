// Comprime imagens no navegador antes do upload:
// redimensiona para no máximo MAX_DIMENSION px (lado maior), converte para WebP
// e reduz qualidade/dimensão até ficar abaixo de MAX_BYTES (~400 KB).

const MAX_DIMENSION = 2000;
const QUALITY = 0.8;
const MIN_QUALITY = 0.45;
const MAX_BYTES = 400 * 1024;
const MIN_DIMENSION = 900;

function supportsWebp(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // cai para o <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
      img.src = url;
    });
  } finally {
    // revoga depois do decode
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export type CompressedImage = {
  file: File;
  ext: string;
  originalSize: number;
  size: number;
};

export async function compressImage(file: File): Promise<CompressedImage> {
  const fallback: CompressedImage = {
    file,
    ext: file.name.split(".").pop()?.toLowerCase() || "jpg",
    originalSize: file.size,
    size: file.size,
  };

  // GIF animado e SVG não devem passar pelo canvas.
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return fallback;
  }

  try {
    const source = await loadBitmap(file);
    const sw = "width" in source ? source.width : 0;
    const sh = "height" in source ? source.height : 0;
    if (!sw || !sh) return fallback;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(sw, sh));
    const width = Math.round(sw * scale);
    const height = Math.round(sh * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    if ("close" in source && typeof source.close === "function") source.close();

    const useWebp = supportsWebp();
    const mime = useWebp ? "image/webp" : "image/jpeg";
    const ext = useWebp ? "webp" : "jpg";

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, QUALITY),
    );
    if (!blob) return fallback;

    // Se a compressão não ajudou, mantém o original.
    if (blob.size >= file.size && scale === 1) return fallback;

    const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
    const out = new File([blob], `${base}.${ext}`, { type: mime });
    return { file: out, ext, originalSize: file.size, size: out.size };
  } catch {
    return fallback;
  }
}

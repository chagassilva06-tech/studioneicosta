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

    const useWebp = supportsWebp();
    const mime = useWebp ? "image/webp" : "image/jpeg";
    const ext = useWebp ? "webp" : "jpg";

    const draw = (targetW: number, targetH: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH);
      return canvas;
    };

    const encode = (canvas: HTMLCanvasElement, q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, q));

    let maxSide = Math.min(MAX_DIMENSION, Math.max(sw, sh));
    let best: Blob | null = null;
    let scale = 1;

    // Reduz qualidade primeiro; se ainda passar de 400 KB, reduz a dimensão.
    outer: while (maxSide >= MIN_DIMENSION) {
      scale = maxSide / Math.max(sw, sh);
      const canvas = draw(Math.round(sw * scale), Math.round(sh * scale));
      if (!canvas) break;

      for (let q = QUALITY; q >= MIN_QUALITY - 0.001; q -= 0.1) {
        const blob = await encode(canvas, Math.round(q * 100) / 100);
        if (!blob) break outer;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= MAX_BYTES) {
          best = blob;
          break outer;
        }
      }
      maxSide = Math.round(maxSide * 0.8);
    }

    if ("close" in source && typeof source.close === "function") source.close();
    if (!best) return fallback;

    // Se a compressão não ajudou, mantém o original.
    if (best.size >= file.size && scale === 1) return fallback;

    const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
    const out = new File([best], `${base}.${ext}`, { type: mime });
    return { file: out, ext, originalSize: file.size, size: out.size };

  } catch {
    return fallback;
  }
}

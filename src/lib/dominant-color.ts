// Extract a vivid dominant color from an image URL.
// Returns rgb string, or null on failure (e.g. CORS).
export async function getDominantColor(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 40;
        const h = 40;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        // Weighted bucket approach: skip near-black/white/gray, weight by saturation.
        const buckets = new Map<string, { r: number; g: number; b: number; weight: number }>();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max < 30 || min > 230) continue; // too dark or too washed
          const sat = max === 0 ? 0 : (max - min) / max;
          if (sat < 0.12) continue; // too gray
          const key = `${r >> 5}-${g >> 5}-${b >> 5}`; // 8 bins per channel
          const cur = buckets.get(key);
          const weight = sat + 0.2;
          if (cur) {
            cur.r += r * weight;
            cur.g += g * weight;
            cur.b += b * weight;
            cur.weight += weight;
          } else {
            buckets.set(key, { r: r * weight, g: g * weight, b: b * weight, weight });
          }
        }

        let best: { r: number; g: number; b: number; weight: number } | null = null;
        for (const v of buckets.values()) {
          if (!best || v.weight > best.weight) best = v;
        }

        // Fallback: simple average
        if (!best) {
          let r = 0, g = 0, b = 0, c = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2]; c++;
          }
          if (!c) return resolve(null);
          return resolve(`rgb(${Math.round(r / c)}, ${Math.round(g / c)}, ${Math.round(b / c)})`);
        }

        let r = Math.round(best.r / best.weight);
        let g = Math.round(best.g / best.weight);
        let b = Math.round(best.b / best.weight);

        // Slightly boost brightness so the frame reads as neon on dark backgrounds.
        const boost = (v: number) => Math.min(255, Math.round(v * 1.15 + 20));
        r = boost(r); g = boost(g); b = boost(b);

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

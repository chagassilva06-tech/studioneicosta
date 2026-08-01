import { useEffect, useState } from "react";
import { getDominantColor } from "@/lib/dominant-color";

export function useDominantColor(url?: string | null) {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!url) {
      setColor(null);
      return;
    }
    let alive = true;
    const request = getDominantColor(url);
    request.then((c) => {
      if (alive) setColor(c);
    });
    return () => {
      alive = false;
    };
  }, [url]);
  return color;
}

// Helper: convert "rgb(r, g, b)" to "r, g, b" for use in rgba() CSS.
export function rgbTriplet(color: string | null): string | null {
  if (!color) return null;
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return null;
  return `${m[1]}, ${m[2]}, ${m[3]}`;
}

const KEY = "studionei_guest";

export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function enterGuest() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

export function exitGuest() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

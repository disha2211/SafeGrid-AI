import { useEffect, useState } from "react";

/** light | dark, persisted; defaults to the OS preference. */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("safegrid-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) { /* storage unavailable */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("safegrid-theme", theme); } catch (_) { /* ignore */ }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

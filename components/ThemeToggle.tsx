"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Theme, string> = { system: "Theme: system", light: "Theme: light", dark: "Theme: dark" };

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") setTheme(t);
  }, []);

  function cycle() {
    const next = NEXT[theme];
    setTheme(next);
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try {
      if (next === "system") localStorage.removeItem("tally.theme");
      else localStorage.setItem("tally.theme", next);
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
  }

  return (
    <button type="button" onClick={cycle} className="chip" aria-label={`${LABEL[theme]}. Change theme`}>
      {LABEL[theme]}
    </button>
  );
}

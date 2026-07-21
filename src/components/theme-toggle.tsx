import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyResolved(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark());
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

function storedTheme(): Theme {
  if (typeof localStorage === "undefined") return "system";
  const v = localStorage.getItem("theme");
  return v === "dark" || v === "light" || v === "system" ? v : "system";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(storedTheme());
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyResolved("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    try { localStorage.setItem("theme", next); } catch {}
    applyResolved(next);
    setTheme(next);
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "Chế độ tối" : theme === "light" ? "Chế độ sáng" : "Tự động theo hệ thống";

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}

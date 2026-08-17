// Shared theme store: single source of truth for "light" | "dark" | system,
// so the manual toggle and chart color hooks (which need literal hex, not
// CSS vars) always agree on what's actually on screen.
const STORAGE_KEY = "theme";
const listeners = new Set();

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getIsDark() {
  const stored = getStoredTheme();
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return systemPrefersDark();
}

function applyThemeAttribute() {
  const stored = getStoredTheme();
  if (stored) {
    document.documentElement.setAttribute("data-theme", stored);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

applyThemeAttribute();

export function setTheme(theme) {
  try {
    if (theme) localStorage.setItem(STORAGE_KEY, theme);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore (private browsing etc.)
  }
  applyThemeAttribute();
  listeners.forEach((fn) => fn());
}

export function toggleTheme() {
  setTheme(getIsDark() ? "light" : "dark");
}

export function subscribeTheme(fn) {
  listeners.add(fn);
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const mqlListener = () => {
    if (!getStoredTheme()) fn();
  };
  mql.addEventListener("change", mqlListener);
  return () => {
    listeners.delete(fn);
    mql.removeEventListener("change", mqlListener);
  };
}

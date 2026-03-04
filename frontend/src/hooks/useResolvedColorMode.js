import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "rms_color_mode_override";
const MODE_CHANGE_EVENT = "rms-color-mode-changed";

const useResolvedColorMode = (theme = {}) => {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false,
  );
  const [overrideMode, setOverrideMode] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "" : "",
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event) => setSystemDark(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const effectivePreference = overrideMode || theme.colorMode || "system";
  const resolvedMode = effectivePreference === "system" ? (systemDark ? "dark" : "light") : effectivePreference;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncOverrideMode = () => {
      setOverrideMode(localStorage.getItem(STORAGE_KEY) || "");
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === STORAGE_KEY) {
        syncOverrideMode();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(MODE_CHANGE_EVENT, syncOverrideMode);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(MODE_CHANGE_EVENT, syncOverrideMode);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");
  }, [resolvedMode]);

  const setUserMode = (mode) => {
    if (!mode || mode === "system") {
      localStorage.removeItem(STORAGE_KEY);
      setOverrideMode("");
      window.dispatchEvent(new Event(MODE_CHANGE_EVENT));
      return;
    }
    localStorage.setItem(STORAGE_KEY, mode);
    setOverrideMode(mode);
    window.dispatchEvent(new Event(MODE_CHANGE_EVENT));
  };

  const palette = useMemo(
    () =>
      resolvedMode === "dark"
        ? {
            pageBg: "#0b1220",
            panelBg: "#111a2d",
            cardBg: "#17233b",
            text: "#e2e8f0",
            muted: "#94a3b8",
            border: "#25324d",
          }
        : {
            pageBg: theme.surfaceColor || "#f8faf8",
            panelBg: "#ffffff",
            cardBg: "#ffffff",
            text: "#0f172a",
            muted: "#475569",
            border: "#e2e8f0",
          },
    [resolvedMode, theme.surfaceColor],
  );

  return {
    resolvedMode,
    setUserMode,
    effectivePreference,
    allowUserThemeToggle: Boolean(theme.allowUserThemeToggle),
    palette,
  };
};

export default useResolvedColorMode;

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
          pageBg: "#0f1724",
          panelBg: "rgba(23, 34, 51, 0.72)",
          cardBg: "rgba(38, 52, 74, 0.56)",
          text: "#eef6ff",
          muted: "#adc0d4",
          border: "rgba(173, 192, 212, 0.20)",
          primary: "#7ec8ff",
          secondary: "#5f8fb8",
          accent: "#9fd8ff",
          hover: "rgba(255, 255, 255, 0.08)",
          glassShadow: "0 28px 60px rgba(2, 6, 23, 0.36)",
          backdrop: "blur(22px) saturate(150%)",
        }
        : {
          pageBg: "#edf4fb",
          panelBg: "rgba(255, 255, 255, 0.52)",
          cardBg: "rgba(255, 255, 255, 0.34)",
          text: "#14304a",
          muted: "#54708a",
          border: "rgba(255, 255, 255, 0.52)",
          primary: "#1b6ea9",
          secondary: "#4d88b4",
          accent: "#89c7ec",
          hover: "rgba(255, 255, 255, 0.34)",
          glassShadow: "0 24px 60px rgba(108, 141, 173, 0.18)",
          backdrop: "blur(22px) saturate(160%)",
        },
    [resolvedMode],
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

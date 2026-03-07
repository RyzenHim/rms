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
          pageBg: "#1a2332",
          panelBg: "#27374D",
          cardBg: "#2f3f54",
          text: "#DDE6ED",
          muted: "#9DB2BF",
          border: "#526D82",
          primary: "#526D82",
          secondary: "#9DB2BF",
          accent: "#526D82",
          hover: "#354657",
        }
        : {
          pageBg: "#DDE6ED",
          panelBg: "#ffffff",
          cardBg: "#f8fafb",
          text: "#27374D",
          muted: "#526D82",
          border: "#9DB2BF",
          primary: "#27374D",
          secondary: "#526D82",
          accent: "#9DB2BF",
          hover: "#f0f4f8",
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

import api, { withAuth } from "./api";

const THEME_CACHE_KEY = "rms_active_theme_cache";
let themeCache = null;

const readThemeCache = () => {
  if (themeCache) return themeCache;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(THEME_CACHE_KEY);
    themeCache = raw ? JSON.parse(raw) : null;
    return themeCache;
  } catch {
    return null;
  }
};

const writeThemeCache = (data) => {
  themeCache = data || null;
  if (typeof window === "undefined") return;

  try {
    if (data) {
      window.localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(data));
    } else {
      window.localStorage.removeItem(THEME_CACHE_KEY);
    }
  } catch {
    // Ignore storage write failures.
  }
};

const themeService = {
  getCachedActiveTheme() {
    return readThemeCache();
  },

  async getActiveTheme() {
    const { data } = await api.get("/theme/active");
    writeThemeCache(data);
    return data;
  },

  async updateTheme(token, payload) {
    const { data } = await api.put("/theme/active", payload, withAuth(token));
    writeThemeCache(data);
    return data;
  },
};

export default themeService;

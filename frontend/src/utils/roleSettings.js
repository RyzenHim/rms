export const getRoleSettingsStorageKey = (roleLabel = "") =>
  `rms_role_settings_${String(roleLabel).replace(/\s+/g, "_").toLowerCase()}`;

export const getStoredRoleSettings = (roleLabel = "") => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(getRoleSettingsStorageKey(roleLabel));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

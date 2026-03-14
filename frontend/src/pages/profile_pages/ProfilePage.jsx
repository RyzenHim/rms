import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiLock, FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/auth_Service";
import AppModal from "../../components/modals/AppModal";
import themeService from "../../services/theme_Service";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

const emptyAddressForm = {
  label: "home",
  customLabel: "",
  fullName: "",
  phone: "",
  street: "",
  area: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  isDefault: false,
};

const ProfilePage = () => {
  const { user, token, updateProfile } = useAuth();
  const [theme, setTheme] = useState({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });
  const [name, setName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  const [addresses, setAddresses] = useState([]);
  const [expandedAddressId, setExpandedAddressId] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    ...emptyAddressForm,
    fullName: user?.name || "",
    phone: user?.phone || "",
  });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMessage, setAddressMessage] = useState({ type: "", text: "" });
  const { palette, resolvedMode } = useResolvedColorMode(theme);

  const roleLabel = useMemo(() => (user?.roles?.length ? user.roles.join(", ") : "customer"), [user?.roles]);
  const isCustomer = useMemo(() => user?.roles?.includes("customer"), [user?.roles]);
  const initials = useMemo(
    () =>
      String(user?.name || "U")
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user?.name],
  );

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((data) => {
        if (data?.theme) setTheme((prev) => ({ ...prev, ...data.theme }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isCustomer || !token) return;
    authService
      .getAddresses(token)
      .then((res) => setAddresses(res.addresses || []))
      .catch((err) =>
        setAddressMessage({
          type: "error",
          text: err?.response?.data?.message || "Unable to load addresses",
        }),
      );
  }, [isCustomer, token]);

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const payload = {};
    if (name.trim() !== (user?.name || "").trim()) payload.name = name.trim();
    if (profileImage.trim() !== (user?.profileImage || "").trim()) payload.profileImage = profileImage.trim();

    if (!Object.keys(payload).length) {
      setMessage({ type: "error", text: "No changes to update." });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(payload);
      setName(updated?.name || "");
      setProfileImage(updated?.profileImage || "");
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Profile update failed." });
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage({ type: "", text: "" });
    setIsPasswordModalOpen(true);
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordSaving) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "All password fields are required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setTimeout(() => setIsPasswordModalOpen(false), 500);
    } catch (err) {
      setPasswordMessage({ type: "error", text: err?.response?.data?.message || "Password update failed." });
    } finally {
      setPasswordSaving(false);
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...emptyAddressForm,
      fullName: user?.name || "",
      phone: user?.phone || "",
    });
  };

  const openAddAddressModal = () => {
    resetAddressForm();
    setAddressMessage({ type: "", text: "" });
    setIsAddressModalOpen(true);
  };

  const onEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || "home",
      customLabel: address.customLabel || "",
      fullName: address.fullName || "",
      phone: address.phone || "",
      street: address.street || "",
      area: address.area || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
      isDefault: Boolean(address.isDefault),
    });
    setAddressMessage({ type: "", text: "" });
    setIsAddressModalOpen(true);
  };

  const onAddressSubmit = async (e) => {
    e.preventDefault();
    if (addressSaving || !token) return;

    setAddressSaving(true);
    setAddressMessage({ type: "", text: "" });
    try {
      const payload = { ...addressForm };
      const res = editingAddressId
        ? await authService.updateAddress(token, editingAddressId, payload)
        : await authService.addAddress(token, payload);

      setAddresses(res.addresses || []);
      setAddressMessage({
        type: "success",
        text: editingAddressId ? "Address updated" : "Address added",
      });
      setIsAddressModalOpen(false);
      resetAddressForm();
    } catch (err) {
      setAddressMessage({
        type: "error",
        text: err?.response?.data?.message || "Address save failed",
      });
    } finally {
      setAddressSaving(false);
    }
  };

  const onDeleteAddress = async (id) => {
    if (!token) return;
    try {
      const res = await authService.deleteAddress(token, id);
      setAddresses(res.addresses || []);
      setAddressMessage({ type: "success", text: "Address deleted" });
      if (editingAddressId === id) resetAddressForm();
      if (expandedAddressId === id) setExpandedAddressId(null);
    } catch (err) {
      setAddressMessage({
        type: "error",
        text: err?.response?.data?.message || "Delete failed",
      });
    }
  };

  const onSetDefault = async (id) => {
    if (!token) return;
    try {
      const res = await authService.setDefaultAddress(token, id);
      setAddresses(res.addresses || []);
      setAddressMessage({ type: "success", text: "Default address updated" });
    } catch (err) {
      setAddressMessage({
        type: "error",
        text: err?.response?.data?.message || "Unable to set default",
      });
    }
  };

  const labelText = (address) =>
    address.label === "other" && address.customLabel ? address.customLabel : address.label;

  const shortAddress = (address) =>
    [address.street, address.city, address.state].filter(Boolean).join(", ") || "Address not available";

  const fullAddress = (address) =>
    [address.street, address.area, address.landmark, address.city, address.state, address.pincode, address.country]
      .filter(Boolean)
      .join(", ");

  const sectionStyle = {
    backgroundColor: palette.panelBg,
    borderColor: palette.border,
    color: palette.text,
  };
  const innerCardStyle = {
    backgroundColor: palette.cardBg,
    borderColor: palette.border,
    color: palette.text,
  };
  const inputStyle = {
    backgroundColor: palette.pageBg,
    borderColor: palette.border,
    color: palette.text,
  };
  const mutedStyle = { color: palette.muted };

  return (
    <div className="mx-auto max-w-[112rem] space-y-3 px-3 py-3 sm:px-4 sm:py-4" style={{ color: palette.text }}>
      <section className="grid gap-3 lg:grid-cols-[260px_1fr] items-start">
        <aside className="h-fit rounded-xl border p-3 shadow-sm lg:sticky lg:top-16" style={sectionStyle}>
          <div className="flex flex-col items-center text-center">
            {profileImage && !imageLoadFailed ? (
              <img
                src={profileImage}
                alt={name || "profile"}
                onError={() => setImageLoadFailed(true)}
                className="h-20 w-20 rounded-full border-4 border-emerald-100 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-black text-emerald-700" style={{ backgroundColor: resolvedMode === "dark" ? "#064e3b" : "#d1fae5" }}>
                {initials}
              </div>
            )}
            <p className="mt-2 text-base font-black" style={{ color: palette.text }}>{user?.name}</p>
            <p className="text-[11px]" style={mutedStyle}>{user?.email}</p>
            <p className="mt-2 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: palette.cardBg, color: palette.text }}>
              {roleLabel}
            </p>
          </div>
        </aside>

        <form
          onSubmit={onProfileSubmit}
          className="space-y-3 rounded-xl border p-3 shadow-sm md:p-4"
          style={sectionStyle}
        >
          <div className="rounded-xl border p-3" style={innerCardStyle}>
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: palette.text }}>Basic Information</p>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <label className="text-sm font-semibold" style={mutedStyle}>
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm"
                  style={inputStyle}
                  required
                />
              </label>
              <label className="text-sm font-semibold" style={mutedStyle}>
                Role (Fixed)
                <input
                  type="text"
                  value={roleLabel}
                  disabled
                  className="mt-1 h-9 w-full rounded-lg border px-3 text-sm"
                  style={inputStyle}
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border p-3" style={innerCardStyle}>
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: palette.text }}>Profile Image</p>
            <label className="mt-3 block text-sm font-semibold" style={mutedStyle}>
              Profile Image URL
              <input
                type="url"
                value={profileImage}
                onChange={(e) => {
                  setProfileImage(e.target.value);
                  setImageLoadFailed(false);
                }}
                placeholder="https://..."
                className="mt-1 h-9 w-full rounded-lg border px-3 text-sm placeholder:text-slate-400"
                style={inputStyle}
              />
            </label>
          </div>

          <div className="rounded-xl border p-3" style={innerCardStyle}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: palette.text }}>Password & Security</p>
                <p className="text-[11px]" style={mutedStyle}>
                  Password fields are hidden by default.
                </p>
              </div>
              <button
                type="button"
                onClick={openPasswordModal}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                <FiLock className="h-3.5 w-3.5" />
                Change Password
              </button>
            </div>
          </div>

          {message.text ? (
            <p
              className={`rounded-xl px-3 py-2 text-xs font-medium ${
                message.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
              style={message.type === "error"
                ? { backgroundColor: resolvedMode === "dark" ? "#450a0a" : "#fef2f2", color: resolvedMode === "dark" ? "#fca5a5" : "#b91c1c" }
                : { backgroundColor: resolvedMode === "dark" ? "#052e16" : "#ecfdf5", color: resolvedMode === "dark" ? "#86efac" : "#047857" }}
            >
              {message.text}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      {isCustomer ? (
        <section className="rounded-xl border p-3 shadow-sm md:p-4" style={sectionStyle}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black" style={{ color: palette.text }}>Address Book</h3>
              <p className="text-xs" style={mutedStyle}>
                Tap arrow to view full address details.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddAddressModal}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add More Address
            </button>
          </div>

          {addressMessage.text ? (
            <p
              className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                addressMessage.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
              style={addressMessage.type === "error"
                ? { backgroundColor: resolvedMode === "dark" ? "#450a0a" : "#fef2f2", color: resolvedMode === "dark" ? "#fca5a5" : "#b91c1c" }
                : { backgroundColor: resolvedMode === "dark" ? "#052e16" : "#ecfdf5", color: resolvedMode === "dark" ? "#86efac" : "#047857" }}
            >
              {addressMessage.text}
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {addresses.map((address) => {
              const expanded = expandedAddressId === address.id;
              return (
                <article
                  key={address.id}
                  className="rounded-xl border p-3"
                  style={innerCardStyle}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black capitalize" style={{ color: palette.text }}>
                        {labelText(address)}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: palette.text }}>
                        {address.fullName} | {address.phone}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs" style={mutedStyle}>
                        {shortAddress(address)}
                      </p>
                      {address.isDefault ? (
                        <p
                          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: resolvedMode === "dark" ? "#064e3b" : "#d1fae5",
                            color: resolvedMode === "dark" ? "#a7f3d0" : "#047857",
                          }}
                        >
                          Default
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedAddressId(expanded ? null : address.id)}
                      className="rounded-md border p-1.5"
                      style={inputStyle}
                    >
                      {expanded ? <FiChevronUp className="h-4 w-4" style={{ color: palette.text }} /> : <FiChevronDown className="h-4 w-4" style={{ color: palette.text }} />}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="mt-2 border-t pt-2" style={{ borderColor: palette.border }}>
                      <p className="text-xs" style={{ color: palette.text }}>{fullAddress(address)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onEditAddress(address)}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white"
                        >
                          Edit
                        </button>
                        {!address.isDefault ? (
                          <button
                            type="button"
                            onClick={() => onSetDefault(address.id)}
                            className="rounded-lg border px-3 py-1.5 text-[11px] font-bold"
                            style={{ borderColor: palette.border, color: palette.text }}
                          >
                            Set Default
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onDeleteAddress(address.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          {!addresses.length ? (
            <p className="text-sm" style={mutedStyle}>No saved addresses yet.</p>
          ) : null}
        </section>
      ) : null}

      <AppModal
        isOpen={isAddressModalOpen}
        title={editingAddressId ? "Edit Address" : "Add Address"}
        onClose={() => {
          setIsAddressModalOpen(false);
          resetAddressForm();
        }}
      >
        <form onSubmit={onAddressSubmit} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold" style={mutedStyle}>
              Label
              <select
                value={addressForm.label}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              >
                <option value="home">Home</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="text-xs font-semibold" style={mutedStyle}>
              Custom Label
              <input
                value={addressForm.customLabel}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, customLabel: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
                placeholder="e.g., Mom's House"
                disabled={addressForm.label !== "other"}
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold" style={mutedStyle}>
              Full Name
              <input
                required
                value={addressForm.fullName}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
            <label className="text-xs font-semibold" style={mutedStyle}>
              Phone
              <input
                required
                value={addressForm.phone}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
          </div>

          <label className="text-xs font-semibold" style={mutedStyle}>
            Street
            <input
              required
              value={addressForm.street}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
              style={inputStyle}
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold" style={mutedStyle}>
              Area
              <input
                value={addressForm.area}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, area: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
            <label className="text-xs font-semibold" style={mutedStyle}>
              Landmark
              <input
                value={addressForm.landmark}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, landmark: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold" style={mutedStyle}>
              City
              <input
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
            <label className="text-xs font-semibold" style={mutedStyle}>
              State
              <input
                required
                value={addressForm.state}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold" style={mutedStyle}>
              Pincode
              <input
                required
                value={addressForm.pincode}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
            <label className="text-xs font-semibold" style={mutedStyle}>
              Country
              <input
                value={addressForm.country}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border px-2 text-sm"
                style={inputStyle}
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: palette.text }}>
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
            />
            Set as default
          </label>

          {addressMessage.text && isAddressModalOpen ? (
            <p
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                addressMessage.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
              style={addressMessage.type === "error"
                ? { backgroundColor: resolvedMode === "dark" ? "#450a0a" : "#fef2f2", color: resolvedMode === "dark" ? "#fca5a5" : "#b91c1c" }
                : { backgroundColor: resolvedMode === "dark" ? "#052e16" : "#ecfdf5", color: resolvedMode === "dark" ? "#86efac" : "#047857" }}
            >
              {addressMessage.text}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddressModalOpen(false);
                resetAddressForm();
              }}
              className="rounded-lg border px-4 py-2 text-xs font-bold"
              style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
            >
              Cancel
            </button>
            <button
              disabled={addressSaving}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {addressSaving ? "Saving..." : editingAddressId ? "Update Address" : "Add Address"}
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal
        isOpen={isPasswordModalOpen}
        title="Change Password"
        onClose={() => setIsPasswordModalOpen(false)}
        maxWidth="max-w-lg"
      >
        <form onSubmit={onPasswordSubmit} className="space-y-3">
          <label className="block text-xs font-semibold" style={mutedStyle}>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
              style={inputStyle}
            />
          </label>
          <label className="block text-xs font-semibold" style={mutedStyle}>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
              style={inputStyle}
            />
          </label>
          <label className="block text-xs font-semibold" style={mutedStyle}>
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
              style={inputStyle}
            />
          </label>

          {passwordMessage.text ? (
            <p
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                passwordMessage.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
              style={passwordMessage.type === "error"
                ? { backgroundColor: resolvedMode === "dark" ? "#450a0a" : "#fef2f2", color: resolvedMode === "dark" ? "#fca5a5" : "#b91c1c" }
                : { backgroundColor: resolvedMode === "dark" ? "#052e16" : "#ecfdf5", color: resolvedMode === "dark" ? "#86efac" : "#047857" }}
            >
              {passwordMessage.text}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="rounded-lg border px-4 py-2 text-xs font-bold"
              style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
            >
              Cancel
            </button>
            <button
              disabled={passwordSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default ProfilePage;

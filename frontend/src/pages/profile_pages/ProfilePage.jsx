import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiLock, FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/auth_Service";
import AppModal from "../../components/modals/AppModal";

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

  return (
    <div className="mx-auto max-w-[90rem] space-y-4 px-3 py-4 sm:px-4 sm:py-6">
      <section className="grid gap-4 lg:grid-cols-[300px_1fr] items-start">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 dark:border-slate-700 dark:bg-[#27374D]">
          <div className="flex flex-col items-center text-center">
            {profileImage && !imageLoadFailed ? (
              <img
                src={profileImage}
                alt={name || "profile"}
                onError={() => setImageLoadFailed(true)}
                className="h-24 w-24 rounded-full border-4 border-emerald-100 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">
                {initials}
              </div>
            )}
            <p className="mt-3 text-lg font-black text-slate-900 dark:text-slate-50">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">{user?.email}</p>
            <p className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {roleLabel}
            </p>
          </div>
        </aside>

        <form
          onSubmit={onProfileSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 dark:border-slate-700 dark:bg-[#27374D]"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-[#1a2332]">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Basic Information</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Role (Fixed)
                <input
                  type="text"
                  value={roleLabel}
                  disabled
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-[#1a2332] dark:text-slate-300"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-[#1a2332]">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Profile Image</p>
            <label className="mt-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Profile Image URL
              <input
                type="url"
                value={profileImage}
                onChange={(e) => {
                  setProfileImage(e.target.value);
                  setImageLoadFailed(false);
                }}
                placeholder="https://..."
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50 dark:placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-[#1a2332]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Password & Security</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Password fields are hidden by default.
                </p>
              </div>
              <button
                type="button"
                onClick={openPasswordModal}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <FiLock className="h-3.5 w-3.5" />
                Change Password
              </button>
            </div>
          </div>

          {message.text ? (
            <p
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      {isCustomer ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 dark:border-slate-700 dark:bg-[#27374D]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Address Book</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Tap arrow to view full address details.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddAddressModal}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add More Address
            </button>
          </div>

          {addressMessage.text ? (
            <p
              className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                addressMessage.type === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
              }`}
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
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-[#1a2332]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black capitalize text-slate-900 dark:text-slate-50">
                        {labelText(address)}
                      </p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {address.fullName} | {address.phone}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-600 dark:text-slate-300">
                        {shortAddress(address)}
                      </p>
                      {address.isDefault ? (
                        <p className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                          Default
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedAddressId(expanded ? null : address.id)}
                      className="rounded-md border border-slate-300 bg-white p-1.5"
                    >
                      {expanded ? <FiChevronUp className="h-4 w-4 text-slate-700" /> : <FiChevronDown className="h-4 w-4 text-slate-700" />}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="mt-2 border-t border-slate-200 pt-2">
                      <p className="text-xs text-slate-700 dark:text-slate-200">{fullAddress(address)}</p>
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
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-bold dark:border-slate-500"
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
            <p className="text-sm text-slate-500 dark:text-slate-300">No saved addresses yet.</p>
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
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              Label
              <select
                value={addressForm.label}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
              >
                <option value="home">Home</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              Custom Label
              <input
                value={addressForm.customLabel}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, customLabel: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
                placeholder="e.g., Mom's House"
                disabled={addressForm.label !== "other"}
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              Full Name
              <input
                required
                value={addressForm.fullName}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              Phone
              <input
                required
                value={addressForm.phone}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
              />
            </label>
          </div>

          <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
            Street
            <input
              required
              value={addressForm.street}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              Area
              <input
                value={addressForm.area}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, area: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              Landmark
              <input
                value={addressForm.landmark}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, landmark: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              City
              <input
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-200">
              State
              <input
                required
                value={addressForm.state}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Pincode
              <input
                required
                value={addressForm.pincode}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Country
              <input
                value={addressForm.country}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
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
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
              }`}
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
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-[#1a2332]"
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
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-200">
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-200">
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-200">
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#27374D] dark:text-slate-50"
            />
          </label>

          {passwordMessage.text ? (
            <p
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                passwordMessage.type === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
              }`}
            >
              {passwordMessage.text}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-[#1a2332]"
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

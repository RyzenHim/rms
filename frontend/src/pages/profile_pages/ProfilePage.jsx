import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const roleLabel = useMemo(() => (user?.roles?.length ? user.roles.join(", ") : "customer"), [user?.roles]);
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

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    const payload = {};
    if (name.trim() !== (user?.name || "").trim()) payload.name = name.trim();
    if (profileImage.trim() !== (user?.profileImage || "").trim()) payload.profileImage = profileImage.trim();
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (!Object.keys(payload).length) {
      setMessage({ type: "error", text: "No changes to update." });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(payload);
      setName(updated?.name || "");
      setProfileImage(updated?.profileImage || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Profile update failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-700 p-6 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/75">My Account</p>
        <h2 className="mt-1 text-3xl font-black">Profile & Security</h2>
        <p className="mt-2 text-sm text-white/85">You can update your name, password and profile image URL. Role, email and phone are fixed.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {profileImage ? (
              <img src={profileImage} alt={name || "profile"} className="h-28 w-28 rounded-full border-4 border-emerald-100 object-cover" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700">
                {initials}
              </div>
            )}
            <p className="mt-3 text-lg font-black text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{roleLabel}</p>
          </div>
        </aside>

        <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Role (Fixed)
                <input type="text" value={roleLabel} disabled className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Email (Fixed)
                <input type="text" value={user?.email || ""} disabled className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600" />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Phone (Fixed)
                <input type="text" value={user?.phone || "Not available"} disabled className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600" />
              </label>
            </div>

            <label className="text-sm font-semibold text-slate-700">
              Profile Image URL
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-500">Image is stored as URL only. Later you can connect Cloudinary URLs.</p>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">Change Password</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                />
              </div>
            </div>

            {message.text ? (
              <p className={`rounded-xl px-3 py-2 text-sm font-medium ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {message.text}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ProfilePage;

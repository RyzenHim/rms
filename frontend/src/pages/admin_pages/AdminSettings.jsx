import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import themeService from "../../services/theme_Service";

const AdminSettings = () => {
  const { token } = useAuth();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    logoText: "",
    heroTitle: "",
    heroSubtitle: "",
    ctaText: "",
    primaryColor: "#0b6b49",
    secondaryColor: "#ffd54f",
    accentColor: "#1f2937",
    surfaceColor: "#f8faf8",
    heroImage: "",
  });

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((res) => {
        setForm((prev) => ({ ...prev, ...res.theme }));
      })
      .catch(() => {
        setMessage("Unable to fetch theme");
      });
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await themeService.updateTheme(token, form);
      setMessage("Theme updated. Refresh landing page to view latest style.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Theme update failed");
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-black text-slate-900">Admin Theme Controls</h2>
      <p className="mt-2 text-slate-600">Manage landing page style from backend.</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["Restaurant Name", "name", "text"],
          ["Logo Text", "logoText", "text"],
          ["Hero Title", "heroTitle", "text"],
          ["CTA Text", "ctaText", "text"],
          ["Primary Color", "primaryColor", "color"],
          ["Secondary Color", "secondaryColor", "color"],
          ["Accent Color", "accentColor", "color"],
          ["Surface Color", "surfaceColor", "color"],
          ["Hero Image URL", "heroImage", "text"],
        ].map(([label, key, type]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            <input
              type={type}
              name={key}
              value={form[key]}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>
        ))}

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Hero Subtitle</span>
          <textarea
            name="heroSubtitle"
            value={form.heroSubtitle}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            rows={3}
          />
        </label>

        <div className="md:col-span-2">
          <button className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white">
            Save Theme
          </button>
          {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

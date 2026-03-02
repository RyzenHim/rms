import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import themeService from "../../services/theme_Service";

const AdminSettings = () => {
  const { token } = useAuth();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    logoText: "",
    logoImage: "",
    heroTitle: "",
    heroSubtitle: "",
    heroTagline: "",
    menuHeading: "",
    menuSubHeading: "",
    ctaText: "",
    primaryColor: "#0b6b49",
    secondaryColor: "#ffd54f",
    accentColor: "#1f2937",
    surfaceColor: "#f8faf8",
    heroImage: "",
    addressLine: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    contactPhone: "",
    contactEmail: "",
    openingHours: "",
    facebookUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
    footerNote: "",
    colorMode: "system",
    allowUserThemeToggle: true,
  });

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((res) => {
        setForm((prev) => ({ ...prev, ...res.theme }));
      })
      .catch(() => {
        setMessage("Unable to fetch settings");
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
      setMessage("Restaurant website settings updated.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Settings update failed");
    }
  };

  const fields = [
    ["Restaurant Name", "name", "text"],
    ["Logo Text", "logoText", "text"],
    ["Logo Image URL", "logoImage", "text"],
    ["Hero Title", "heroTitle", "text"],
    ["Hero Tagline", "heroTagline", "text"],
    ["CTA Text", "ctaText", "text"],
    ["Menu Heading", "menuHeading", "text"],
    ["Menu Sub Heading", "menuSubHeading", "text"],
    ["Primary Color", "primaryColor", "color"],
    ["Secondary Color", "secondaryColor", "color"],
    ["Accent Color", "accentColor", "color"],
    ["Surface Color", "surfaceColor", "color"],
    ["Hero Image URL", "heroImage", "text"],
    ["Address", "addressLine", "text"],
    ["City", "city", "text"],
    ["State", "state", "text"],
    ["Country", "country", "text"],
    ["Postal Code", "postalCode", "text"],
    ["Contact Phone", "contactPhone", "text"],
    ["Contact Email", "contactEmail", "text"],
    ["Opening Hours", "openingHours", "text"],
    ["Facebook URL", "facebookUrl", "text"],
    ["Instagram URL", "instagramUrl", "text"],
    ["YouTube URL", "youtubeUrl", "text"],
    ["Twitter URL", "twitterUrl", "text"],
    ["Default Color Mode", "colorMode", "select"],
  ];

  return (
    <div>
      <h2 className="text-3xl font-black text-slate-900">Website Customization</h2>
      <p className="mt-2 text-slate-600">
        Admin can dynamically manage branding, headings, contact info, address, socials and landing sections.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map(([label, key, type]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            {type === "select" ? (
              <select
                name={key}
                value={form[key] || "system"}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            ) : (
              <input
                type={type}
                name={key}
                value={form[key] || ""}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            )}
          </label>
        ))}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Allow User Theme Toggle</span>
          <select
            name="allowUserThemeToggle"
            value={String(form.allowUserThemeToggle)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, allowUserThemeToggle: e.target.value === "true" }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Hero Subtitle</span>
          <textarea
            name="heroSubtitle"
            value={form.heroSubtitle || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            rows={3}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Footer Note</span>
          <textarea
            name="footerNote"
            value={form.footerNote || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            rows={3}
          />
        </label>

        <div className="md:col-span-2">
          <button className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white">
            Save Settings
          </button>
          {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

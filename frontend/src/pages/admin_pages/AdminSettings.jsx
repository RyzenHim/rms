import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiDroplet,
  FiEdit3,
  FiGlobe,
  FiImage,
  FiMapPin,
} from "react-icons/fi";
import AppModal from "../../components/modals/AppModal";
import { useAuth } from "../../context/AuthContext";
import themeService from "../../services/theme_Service";

const colorFields = [
  { name: "primaryColor", label: "Primary Color", fallback: "#ff8c3a" },
  { name: "secondaryColor", label: "Secondary Color", fallback: "#ffd700" },
  { name: "accentColor", label: "Accent Color", fallback: "#292524" },
  { name: "surfaceColor", label: "Surface Color", fallback: "#fafaf9" },
];

const sectionDefinitions = [
  {
    id: "branding",
    title: "Branding",
    description: "Restaurant identity, logo text, and hero visuals.",
    icon: FiEdit3,
    tone: "from-sky-500 to-cyan-400",
    fields: [
      { name: "name", label: "Restaurant Name", placeholder: "e.g., Emerald Bistro" },
      { name: "logoText", label: "Logo Text", placeholder: "e.g., DelishDrop" },
      { name: "logoImage", label: "Logo Image URL", placeholder: "https://...", full: true },
      { name: "heroTagline", label: "Hero Tagline", placeholder: "e.g., Dynamic Restaurant Website" },
      { name: "heroTitle", label: "Hero Title", placeholder: "Main homepage headline" },
      { name: "heroSubtitle", label: "Hero Subtitle", type: "textarea", placeholder: "Secondary message for the hero section", full: true },
      { name: "heroImage", label: "Hero Image URL", placeholder: "https://images.unsplash.com/...", full: true },
      { name: "ctaText", label: "CTA Button Text", placeholder: "e.g., Get Started" },
    ],
  },
  {
    id: "menu",
    title: "Menu Experience",
    description: "Headings and section copy used on the menu page.",
    icon: FiImage,
    tone: "from-amber-500 to-orange-400",
    fields: [
      { name: "menuHeading", label: "Menu Heading", placeholder: "e.g., Browse Our Menu" },
      { name: "menuSubHeading", label: "Menu Subheading", placeholder: "Supporting text for the menu page", full: true },
      { name: "footerNote", label: "Footer Message", type: "textarea", placeholder: "Special footer note or closing message", full: true },
    ],
  },
  {
    id: "colors",
    title: "Colors and Theme",
    description: "Palette, default color mode, and user theme access.",
    icon: FiDroplet,
    tone: "from-fuchsia-500 to-violet-500",
    fields: [
      ...colorFields.map((field) => ({ ...field, type: "color-pair" })),
      { name: "colorMode", label: "Default Color Mode", type: "select", options: [
        { value: "system", label: "System (User Device)" },
        { value: "light", label: "Always Light" },
        { value: "dark", label: "Always Dark" },
      ] },
      { name: "allowUserThemeToggle", label: "Allow Theme Toggle", type: "boolean-select" },
    ],
  },
  {
    id: "contact",
    title: "Contact and Address",
    description: "Storefront address, phone, email, and opening hours.",
    icon: FiMapPin,
    tone: "from-emerald-500 to-teal-400",
    fields: [
      { name: "addressLine", label: "Address", placeholder: "Street address", full: true },
      { name: "city", label: "City", placeholder: "City" },
      { name: "state", label: "State", placeholder: "State" },
      { name: "country", label: "Country", placeholder: "Country" },
      { name: "postalCode", label: "Postal Code", placeholder: "Postal Code" },
      { name: "contactPhone", label: "Phone", placeholder: "Phone number" },
      { name: "contactEmail", label: "Email", placeholder: "Email address", type: "email" },
      { name: "openingHours", label: "Opening Hours", placeholder: "e.g., Mon-Sun: 11 AM - 11 PM", full: true },
    ],
  },
  {
    id: "social",
    title: "Social Links",
    description: "External channels displayed across the site.",
    icon: FiGlobe,
    tone: "from-rose-500 to-pink-400",
    fields: [
      { name: "facebookUrl", label: "Facebook URL", placeholder: "https://facebook.com/..." },
      { name: "instagramUrl", label: "Instagram URL", placeholder: "https://instagram.com/..." },
      { name: "youtubeUrl", label: "YouTube URL", placeholder: "https://youtube.com/..." },
      { name: "twitterUrl", label: "Twitter URL", placeholder: "https://twitter.com/..." },
    ],
  },
];

const initialForm = {
  name: "",
  logoText: "",
  logoImage: "",
  heroTitle: "",
  heroSubtitle: "",
  heroTagline: "",
  menuHeading: "",
  menuSubHeading: "",
  ctaText: "",
  primaryColor: "#ff8c3a",
  secondaryColor: "#ffd700",
  accentColor: "#292524",
  surfaceColor: "#fafaf9",
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
};

const AdminSettings = () => {
  const { token } = useAuth();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(initialForm);
  const [activeSection, setActiveSection] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((res) => {
        setForm((prev) => ({ ...prev, ...(res?.theme || {}) }));
      })
      .catch(() => {
        setMessage({ type: "error", text: "Unable to fetch settings" });
      });
  }, []);

  const activeConfig = useMemo(
    () => sectionDefinitions.find((section) => section.id === activeSection) || null,
    [activeSection],
  );

  const setFieldValue = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await themeService.updateTheme(token, form);
      setMessage({ type: "success", text: "Restaurant website settings updated." });
      setActiveSection(null);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Settings update failed" });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    if (field.type === "textarea") {
      return (
        <textarea
          name={field.name}
          value={form[field.name] || ""}
          onChange={(event) => setFieldValue(field.name, event.target.value)}
          className="input-base min-h-[7rem]"
          rows={4}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          name={field.name}
          value={form[field.name] || ""}
          onChange={(event) => setFieldValue(field.name, event.target.value)}
          className="input-base"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "boolean-select") {
      return (
        <select
          name={field.name}
          value={String(form[field.name])}
          onChange={(event) => setFieldValue(field.name, event.target.value === "true")}
          className="input-base"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      );
    }

    if (field.type === "color-pair") {
      return (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/30 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
          <input
            type="color"
            value={form[field.name] || field.fallback}
            onChange={(event) => setFieldValue(field.name, event.target.value)}
            className="h-12 w-12 cursor-pointer rounded-2xl border border-white/30 bg-transparent"
          />
          <input
            type="text"
            value={form[field.name] || field.fallback}
            onChange={(event) => setFieldValue(field.name, event.target.value)}
            className="input-base font-mono text-xs font-bold"
          />
        </div>
      );
    }

    return (
      <input
        type={field.type || "text"}
        name={field.name}
        value={form[field.name] || ""}
        onChange={(event) => setFieldValue(field.name, event.target.value)}
        className="input-base"
        placeholder={field.placeholder}
      />
    );
  };

  const sectionPreview = (sectionId) => {
    if (sectionId === "branding") {
      return form.name || form.logoText || "Restaurant identity not configured";
    }
    if (sectionId === "menu") {
      return form.menuHeading || "Menu page text not configured";
    }
    if (sectionId === "colors") {
      return `${form.colorMode || "system"} mode with ${form.allowUserThemeToggle ? "toggle enabled" : "toggle disabled"}`;
    }
    if (sectionId === "contact") {
      return form.contactEmail || form.contactPhone || "No contact details configured";
    }
    if (sectionId === "social") {
      return form.instagramUrl || form.facebookUrl || "Social links not configured";
    }
    return "";
  };

  return (
    <div className="space-y-5">
      <section className="glass-panel animate-rise-in rounded-[1.8rem] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="glass-pill inline-flex rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Brand Studio
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
              Website Customization
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Settings are grouped into focused categories. Open a section, update it in a modal, and publish changes without scrolling through one long form.
            </p>
          </div>
          <div className="glass-subtle rounded-[1.25rem] px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Changes apply across the site after save.
          </div>
        </div>
        {message.text ? <div className={`mt-4 ${message.type === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {sectionDefinitions.map((section, index) => {
          const Icon = section.icon;
          return (
            <article key={section.id} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} smooth-transform p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${section.tone} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{section.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{section.description}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {sectionPreview(section.id)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Manage
                  <FiArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card-elevated animate-fade-in-up p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Quick Overview</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Current public-facing contact, menu, and theme status.</p>
          </div>
          <button type="button" onClick={saveSettings} disabled={saving} className="btn-primary px-5 py-2.5 text-sm">
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="glass-subtle rounded-[1.2rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Contact</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{form.contactEmail || "No email set"}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{form.contactPhone || "No phone set"}</p>
          </div>
          <div className="glass-subtle rounded-[1.2rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Homepage</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{form.heroTitle || "No hero title set"}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{form.ctaText || "No CTA set"}</p>
          </div>
          <div className="glass-subtle rounded-[1.2rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Theme</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{form.colorMode || "system"}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{form.allowUserThemeToggle ? "User theme toggle enabled" : "User theme toggle disabled"}</p>
          </div>
        </div>
      </section>

      <AppModal
        isOpen={Boolean(activeConfig)}
        title={activeConfig ? `${activeConfig.title} Settings` : ""}
        onClose={() => setActiveSection(null)}
        maxWidth="max-w-4xl"
      >
        {activeConfig ? (
          <div className="space-y-5">
            <div className="rounded-[1.25rem] border border-white/30 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-600 dark:text-slate-300">{activeConfig.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeConfig.fields.map((field) => (
                <div key={field.name} className={field.full ? "md:col-span-2" : ""}>
                  <label className="form-label">{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setActiveSection(null)} className="btn-outline px-5 py-2.5 text-sm">
                Cancel
              </button>
              <button type="button" onClick={saveSettings} disabled={saving} className="btn-primary px-5 py-2.5 text-sm">
                {saving ? "Saving..." : "Save Section"}
              </button>
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  );
};

export default AdminSettings;

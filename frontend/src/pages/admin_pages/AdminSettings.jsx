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

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="heading-1"> Website Customization</h2>
        <p className="text-lg text-slate-600">
          Manage your restaurant branding, colors, contact info, and landing page content. All changes apply instantly across the site.
        </p>
      </div>

      {message && (
        <div className={message.includes('updated') || message.includes('Settings') ? 'alert-success' : 'alert-error'}>
          {message}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Restaurant Branding</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Restaurant Name</label>
              <input
                type="text"
                name="name"
                value={form.name || ""}
                onChange={onChange}
                className="input-base"
                placeholder="e.g., Emerald Bistro"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Logo Text</label>
              <input
                type="text"
                name="logoText"
                value={form.logoText || ""}
                onChange={onChange}
                className="input-base"
                placeholder="e.g., DelishDrop"
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Logo Image URL</label>
              <input
                type="text"
                name="logoImage"
                value={form.logoImage || ""}
                onChange={onChange}
                className="input-base"
                placeholder="https://..."
              />
              <p className="form-hint">120×120 PNG recommended</p>
            </div>
          </div>
        </section>

        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Brand Colors</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="form-group">
              <label className="form-label">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  value={form.primaryColor || "#0b6b49"}
                  onChange={onChange}
                  className="h-12 w-12 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primaryColor || "#0b6b49"}
                  onChange={onChange}
                  name="primaryColor"
                  className="input-base flex-1 text-xs font-bold font-mono"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="secondaryColor"
                  value={form.secondaryColor || "#ffd54f"}
                  onChange={onChange}
                  className="h-12 w-12 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.secondaryColor || "#ffd54f"}
                  onChange={onChange}
                  name="secondaryColor"
                  className="input-base flex-1 text-xs font-bold font-mono"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="accentColor"
                  value={form.accentColor || "#1f2937"}
                  onChange={onChange}
                  className="h-12 w-12 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.accentColor || "#1f2937"}
                  onChange={onChange}
                  name="accentColor"
                  className="input-base flex-1 text-xs font-bold font-mono"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Surface Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="surfaceColor"
                  value={form.surfaceColor || "#f8faf8"}
                  onChange={onChange}
                  className="h-12 w-12 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.surfaceColor || "#f8faf8"}
                  onChange={onChange}
                  name="surfaceColor"
                  className="input-base flex-1 text-xs font-bold font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Homepage Content</h3>
          <div className="space-y-5">
            <div className="form-group">
              <label className="form-label">Hero Tagline</label>
              <input
                type="text"
                name="heroTagline"
                value={form.heroTagline || ""}
                onChange={onChange}
                className="input-base"
                placeholder="e.g., Dynamic Restaurant Website"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hero Title</label>
              <input
                type="text"
                name="heroTitle"
                value={form.heroTitle || ""}
                onChange={onChange}
                className="input-base"
                placeholder="Main headline for homepage"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hero Subtitle</label>
              <textarea
                name="heroSubtitle"
                value={form.heroSubtitle || ""}
                onChange={onChange}
                className="input-base"
                rows={3}
                placeholder="Secondary text for home hero section"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hero Image URL</label>
              <input
                type="text"
                name="heroImage"
                value={form.heroImage || ""}
                onChange={onChange}
                className="input-base"
                placeholder="https://images.unsplash.com/..."
              />
              <p className="form-hint">1600×900 recommended</p>
            </div>
            <div className="form-group">
              <label className="form-label">CTA Button Text</label>
              <input
                type="text"
                name="ctaText"
                value={form.ctaText || ""}
                onChange={onChange}
                className="input-base"
                placeholder="e.g., Get Started"
              />
            </div>
          </div>
        </section>

        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Menu Page</h3>
          <div className="space-y-5">
            <div className="form-group">
              <label className="form-label">Menu Heading</label>
              <input
                type="text"
                name="menuHeading"
                value={form.menuHeading || ""}
                onChange={onChange}
                className="input-base"
                placeholder="e.g., Browse Our Menu"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Menu Subheading</label>
              <input
                type="text"
                name="menuSubHeading"
                value={form.menuSubHeading || ""}
                onChange={onChange}
                className="input-base"
                placeholder="Supporting text for menu page"
              />
            </div>
          </div>
        </section>

        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Contact & Address</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                name="addressLine"
                value={form.addressLine || ""}
                onChange={onChange}
                className="input-base"
                placeholder="Street address"
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={form.city || ""}
                onChange={onChange}
                className="input-base"
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                value={form.state || ""}
                onChange={onChange}
                className="input-base"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                name="country"
                value={form.country || ""}
                onChange={onChange}
                className="input-base"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={form.postalCode || ""}
                onChange={onChange}
                className="input-base"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Opening Hours</label>
              <input
                type="text"
                name="openingHours"
                value={form.openingHours || ""}
                onChange={onChange}
                className="input-base"
                placeholder="e.g., Mon-Sun: 11 AM - 11 PM"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone || ""}
                onChange={onChange}
                className="input-base"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail || ""}
                onChange={onChange}
                className="input-base"
              />
            </div>
          </div>
        </section>

        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Social Media</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Facebook URL</label>
              <input
                type="text"
                name="facebookUrl"
                value={form.facebookUrl || ""}
                onChange={onChange}
                className="input-base"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Instagram URL</label>
              <input
                type="text"
                name="instagramUrl"
                value={form.instagramUrl || ""}
                onChange={onChange}
                className="input-base"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">YouTube URL</label>
              <input
                type="text"
                name="youtubeUrl"
                value={form.youtubeUrl || ""}
                onChange={onChange}
                className="input-base"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Twitter URL</label>
              <input
                type="text"
                name="twitterUrl"
                value={form.twitterUrl || ""}
                onChange={onChange}
                className="input-base"
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>
        </section>

        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Theme Settings</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Default Color Mode</label>
              <select
                name="colorMode"
                value={form.colorMode || "system"}
                onChange={onChange}
                className="input-base"
              >
                <option value="system">System (User Device)</option>
                <option value="light">Always Light</option>
                <option value="dark">Always Dark</option>
              </select>
              <p className="form-hint">Choose the default theme for visitors</p>
            </div>
            <div className="form-group">
              <label className="form-label">Allow Theme Toggle</label>
              <select
                name="allowUserThemeToggle"
                value={String(form.allowUserThemeToggle)}
                onChange={(e) => setForm((prev) => ({ ...prev, allowUserThemeToggle: e.target.value === "true" }))}
                className="input-base"
              >
                <option value="true"> Enabled</option>
                <option value="false"> Disabled</option>
              </select>
              <p className="form-hint">Let users switch between light/dark mode</p>
            </div>
          </div>
        </section>

        <section className="card-elevated p-8">
          <h3 className="heading-3 mb-6"> Footer</h3>
          <div className="form-group">
            <label className="form-label">Footer Note</label>
            <textarea
              name="footerNote"
              value={form.footerNote || ""}
              onChange={onChange}
              className="input-base"
              rows={3}
              placeholder="Special message or tagline for footer"
            />
          </div>
        </section>

        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
             Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

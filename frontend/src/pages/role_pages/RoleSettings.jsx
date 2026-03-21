import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBell,
  FiClock,
  FiLayout,
  FiShield,
  FiSliders,
} from "react-icons/fi";
import AppModal from "../../components/modals/AppModal";
import { getRoleSettingsStorageKey } from "../../utils/roleSettings";

const roleConfigs = {
  Manager: [
    {
      id: "notifications",
      title: "Notifications",
      description: "Order alerts, escalations, and reservation updates.",
      icon: FiBell,
      tone: "from-sky-500 to-cyan-400",
      fields: [
        { name: "criticalOrderAlerts", label: "Critical order alerts", type: "boolean-select" },
        { name: "reservationAlerts", label: "Reservation alerts", type: "boolean-select" },
        { name: "summaryDigest", label: "Daily summary digest", type: "boolean-select" },
      ],
    },
    {
      id: "workspace",
      title: "Workspace",
      description: "Default landing workflow and board density.",
      icon: FiLayout,
      tone: "from-amber-500 to-orange-400",
      fields: [
        { name: "defaultLanding", label: "Default landing view", type: "select", options: [
          { value: "dashboard", label: "Dashboard" },
          { value: "orders", label: "Orders" },
          { value: "table-status", label: "Table Status" },
        ] },
        { name: "compactMode", label: "Compact workspace", type: "boolean-select" },
      ],
    },
    {
      id: "security",
      title: "Security",
      description: "Session length and re-check reminders.",
      icon: FiShield,
      tone: "from-fuchsia-500 to-violet-500",
      fields: [
        { name: "sessionTimeout", label: "Session timeout", type: "select", options: [
          { value: "30m", label: "30 minutes" },
          { value: "1h", label: "1 hour" },
          { value: "4h", label: "4 hours" },
        ] },
        { name: "loginReminder", label: "Login reminder", type: "boolean-select" },
      ],
    },
  ],
  Cashier: [
    {
      id: "notifications",
      title: "Notifications",
      description: "Billing queue and payment exceptions.",
      icon: FiBell,
      tone: "from-sky-500 to-cyan-400",
      fields: [
        { name: "paymentAlerts", label: "Payment alerts", type: "boolean-select" },
        { name: "refundAlerts", label: "Refund alerts", type: "boolean-select" },
      ],
    },
    {
      id: "workspace",
      title: "Billing Workspace",
      description: "Receipt view and billing panel behavior.",
      icon: FiSliders,
      tone: "from-emerald-500 to-teal-400",
      fields: [
        { name: "defaultLanding", label: "Default landing view", type: "select", options: [
          { value: "dashboard", label: "Dashboard" },
          { value: "billing", label: "Billing" },
          { value: "orders", label: "Orders" },
        ] },
        { name: "showTaxBreakdown", label: "Show tax breakdown", type: "boolean-select" },
      ],
    },
  ],
  "Kitchen Staff": [
    {
      id: "notifications",
      title: "Kitchen Alerts",
      description: "Rush tickets and ready-for-serve reminders.",
      icon: FiBell,
      tone: "from-orange-500 to-amber-400",
      fields: [
        { name: "rushAlerts", label: "Rush alerts", type: "boolean-select" },
        { name: "readyReminder", label: "Ready reminder", type: "boolean-select" },
      ],
    },
    {
      id: "board",
      title: "Board Layout",
      description: "Kitchen board timing and density.",
      icon: FiClock,
      tone: "from-fuchsia-500 to-violet-500",
      fields: [
        { name: "defaultLanding", label: "Default landing view", type: "select", options: [
          { value: "orders", label: "Orders Board" },
        ] },
        { name: "showPrepTimers", label: "Show prep timers", type: "boolean-select" },
      ],
    },
  ],
  Waiter: [
    {
      id: "notifications",
      title: "Service Alerts",
      description: "Table requests and served-order prompts.",
      icon: FiBell,
      tone: "from-sky-500 to-cyan-400",
      fields: [
        { name: "tableRequestAlerts", label: "Table request alerts", type: "boolean-select" },
        { name: "servedOrderAlerts", label: "Served order alerts", type: "boolean-select" },
      ],
    },
    {
      id: "workspace",
      title: "Service Workspace",
      description: "Landing page and compact table list.",
      icon: FiLayout,
      tone: "from-emerald-500 to-teal-400",
      fields: [
        { name: "defaultLanding", label: "Default landing view", type: "select", options: [
          { value: "orders", label: "Orders" },
          { value: "table-status", label: "Table Status" },
        ] },
        { name: "compactMode", label: "Compact table list", type: "boolean-select" },
      ],
    },
  ],
};

const defaultPreferences = {
  criticalOrderAlerts: true,
  reservationAlerts: true,
  summaryDigest: true,
  defaultLanding: "dashboard",
  compactMode: false,
  sessionTimeout: "1h",
  loginReminder: true,
  paymentAlerts: true,
  refundAlerts: true,
  showTaxBreakdown: true,
  rushAlerts: true,
  readyReminder: true,
  showPrepTimers: true,
  tableRequestAlerts: true,
  servedOrderAlerts: true,
};

const RoleSettings = ({ roleLabel }) => {
  const storageKey = useMemo(() => getRoleSettingsStorageKey(roleLabel), [roleLabel]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeSection, setActiveSection] = useState(null);

  const sections = roleConfigs[roleLabel] || roleConfigs.Manager;
  const activeConfig = sections.find((section) => section.id === activeSection) || null;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setPreferences((prev) => ({ ...prev, ...JSON.parse(stored) }));
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  const setFieldValue = (name, value) => {
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    setMessage({ type: "success", text: `${roleLabel} settings saved.` });
    setActiveSection(null);
  };

  const renderField = (field) => {
    if (field.type === "select") {
      return (
        <select
          value={preferences[field.name] ?? ""}
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

    return (
      <select
        value={String(preferences[field.name])}
        onChange={(event) => setFieldValue(field.name, event.target.value === "true")}
        className="input-base"
      >
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
    );
  };

  const previewText = (sectionId) => {
    if (sectionId === "notifications") {
      return "Alert preferences ready";
    }
    if (sectionId === "workspace" || sectionId === "board") {
      return `${preferences.defaultLanding || "dashboard"} default`;
    }
    if (sectionId === "security") {
      return `${preferences.sessionTimeout || "1h"} session timeout`;
    }
    return "Ready";
  };

  return (
    <div className="space-y-5">
      <section className="glass-panel animate-rise-in rounded-[1.8rem] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="glass-pill inline-flex rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Preferences
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
              {roleLabel} Settings
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Preferences are grouped into categories and edited inside modals to keep the page clean and consistent with the rest of the internal UI.
            </p>
          </div>
          <button type="button" onClick={savePreferences} className="btn-primary px-5 py-2.5 text-sm">
            Save Preferences
          </button>
        </div>
        {message.text ? <div className={`mt-4 ${message.type === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <article key={section.id} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} smooth-transform p-5`}>
              <div className="flex items-start gap-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${section.tone} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{section.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{section.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {previewText(section.id)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Configure
                  <FiArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <AppModal
        isOpen={Boolean(activeConfig)}
        title={activeConfig ? `${activeConfig.title} Settings` : ""}
        onClose={() => setActiveSection(null)}
        maxWidth="max-w-3xl"
      >
        {activeConfig ? (
          <div className="space-y-5">
            <div className="rounded-[1.25rem] border border-white/30 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-600 dark:text-slate-300">{activeConfig.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeConfig.fields.map((field) => (
                <div key={field.name}>
                  <label className="form-label">{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setActiveSection(null)} className="btn-outline px-5 py-2.5 text-sm">
                Cancel
              </button>
              <button type="button" onClick={savePreferences} className="btn-primary px-5 py-2.5 text-sm">
                Save Section
              </button>
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  );
};

export default RoleSettings;

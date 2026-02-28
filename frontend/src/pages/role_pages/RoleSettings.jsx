const RoleSettings = ({ roleLabel }) => {
  return (
    <div>
      <h2 className="text-3xl font-black text-slate-900">{roleLabel} Settings</h2>
      <p className="mt-2 text-slate-600">
        Preferences and controls scoped to {roleLabel.toLowerCase()} permissions.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Notification Rules</p>
          <p className="mt-1 text-sm text-slate-600">Configure alerts for operational events.</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Access & Security</p>
          <p className="mt-1 text-sm text-slate-600">Review login history and session policies.</p>
        </article>
      </div>
    </div>
  );
};

export default RoleSettings;

const RoleDashboard = ({ roleLabel }) => {
  return (
    <div>
      <h2 className="text-3xl font-black text-slate-900">{roleLabel} Dashboard</h2>
      <p className="mt-2 text-slate-600">
        Live stats, workflow summary, and quick actions for the {roleLabel.toLowerCase()} role.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Pending Orders</p>
          <p className="mt-1 text-3xl font-black text-slate-900">24</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Active Tables</p>
          <p className="mt-1 text-3xl font-black text-slate-900">11</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Revenue Today</p>
          <p className="mt-1 text-3xl font-black text-slate-900">$1,850</p>
        </article>
      </div>
    </div>
  );
};

export default RoleDashboard;

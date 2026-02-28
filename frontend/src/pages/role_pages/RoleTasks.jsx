const RoleTasks = ({ roleLabel }) => {
  return (
    <div>
      <h2 className="text-3xl font-black text-slate-900">{roleLabel} Tasks</h2>
      <p className="mt-2 text-slate-600">Priority task board for {roleLabel.toLowerCase()} operations.</p>

      <div className="mt-6 space-y-3">
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Task 1: Verify order queue</p>
          <p className="text-sm text-slate-600">Ensure no delayed orders and update status.</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Task 2: Coordinate with staff</p>
          <p className="text-sm text-slate-600">Review shift handover and assign responsibilities.</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Task 3: Monitor service quality</p>
          <p className="text-sm text-slate-600">Track complaints and close pending issues.</p>
        </article>
      </div>
    </div>
  );
};

export default RoleTasks;

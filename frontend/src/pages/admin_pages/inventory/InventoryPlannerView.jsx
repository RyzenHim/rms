import { FiCalendar, FiCheckCircle, FiClipboard, FiTrendingUp, FiUsers } from "react-icons/fi";
import { titleize } from "./inventoryUtils";

const MealChecklist = ({ title, items, selectedIds, onToggle }) => (
  <article className="glass-subtle rounded-[1.4rem] p-4">
    <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">{title}</h4>
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <label key={item._id} className="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-slate-200/60 px-3 py-3 text-sm text-slate-700 transition hover:bg-white/60 dark:border-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-800/30">
          <input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => onToggle(item._id)} className="mt-1" />
          <span>
            <span className="block font-semibold">{item.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.foodType === "veg" ? "Veg" : "Non-Veg"} • {item.courseLabel}</span>
          </span>
        </label>
      ))}
      {!items.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No menu items available for this course yet.</p> : null}
    </div>
  </article>
);

const InventoryPlannerView = ({ plannerForm, setPlannerForm, menuOptions, plannerResult, togglePlannerSelection, canManageInventory }) => (
  <div className="space-y-6">
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            Event Planning
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Party Inventory Planner</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            This assistant uses your current inventory plus selected menu items to estimate whether party demand is covered and where you should top up stock.
          </p>
        </div>
        <div className="glass-pill rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
          Heuristic AI-style assistant
        </div>
      </div>
    </section>

    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiCalendar className="h-5 w-5 text-sky-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Event Inputs</h3>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <select value={plannerForm.partyType} onChange={(event) => setPlannerForm((prev) => ({ ...prev, partyType: event.target.value }))} className="input-base">
            {plannerForm.partyTypeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input type="number" min="1" value={plannerForm.attendants} onChange={(event) => setPlannerForm((prev) => ({ ...prev, attendants: Number(event.target.value || 0) }))} placeholder="Attendants" className="input-base" />
          <select value={plannerForm.guestSplitMode} onChange={(event) => setPlannerForm((prev) => ({ ...prev, guestSplitMode: event.target.value }))} className="input-base">
            <option value="percentage">Veg/Non-Veg by percentage</option>
            <option value="count">Veg/Non-Veg by guest count</option>
          </select>
          <input type="number" min="0" max={plannerForm.guestSplitMode === "percentage" ? 100 : plannerForm.attendants} value={plannerForm.vegValue} onChange={(event) => setPlannerForm((prev) => ({ ...prev, vegValue: Number(event.target.value || 0) }))} placeholder={plannerForm.guestSplitMode === "percentage" ? "Veg %" : "Veg guests"} className="input-base" />
          <input type="number" min="0" value={plannerForm.bufferPercent} onChange={(event) => setPlannerForm((prev) => ({ ...prev, bufferPercent: Number(event.target.value || 0) }))} placeholder="Buffer %" className="input-base" />
          <input type="text" value={plannerForm.notes} onChange={(event) => setPlannerForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Notes, venue style, serving pattern..." className="input-base" />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <MealChecklist title="Starter Choices" items={menuOptions.starters} selectedIds={plannerForm.selectedItems} onToggle={togglePlannerSelection} />
          <MealChecklist title="Main Course Choices" items={menuOptions.mains} selectedIds={plannerForm.selectedItems} onToggle={togglePlannerSelection} />
          <MealChecklist title="Beverages" items={menuOptions.beverages} selectedIds={plannerForm.selectedItems} onToggle={togglePlannerSelection} />
          <MealChecklist title="Desserts" items={menuOptions.desserts} selectedIds={plannerForm.selectedItems} onToggle={togglePlannerSelection} />
        </div>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiClipboard className="h-5 w-5 text-emerald-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Planning Output</h3>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="glass-subtle rounded-[1.3rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Veg Guests</p>
            <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{plannerResult.guestCounts.veg}</p>
          </div>
          <div className="glass-subtle rounded-[1.3rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Non-Veg Guests</p>
            <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{plannerResult.guestCounts.nonVeg}</p>
          </div>
          <div className="glass-subtle rounded-[1.3rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Coverage</p>
            <p className={`mt-3 text-2xl font-black ${plannerResult.isSufficient ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
              {plannerResult.isSufficient ? "Sufficient" : "Needs Restock"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/20">
          <div className="flex items-center gap-2">
            <FiUsers className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {plannerForm.partyType} for {plannerForm.attendants} guests with {plannerForm.bufferPercent}% buffer
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plannerResult.summaryText}</p>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">Category Check</h4>
          <div className="mt-3 space-y-3">
            {plannerResult.categories.map((entry) => (
              <article key={entry.category} className="glass-subtle rounded-[1.3rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-50">{titleize(entry.category)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Need {entry.required.toFixed(1)} • Available {entry.available.toFixed(1)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${entry.status === "ok" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"}`}>
                    {entry.status === "ok" ? "Covered" : "Short"}
                  </span>
                </div>
                {entry.shortfall > 0 ? (
                  <div className="mt-3 rounded-[1rem] bg-white/70 px-3 py-3 text-sm text-slate-700 dark:bg-slate-800/30 dark:text-slate-200">
                    <p className="font-semibold">Suggested fill:</p>
                    <p className="mt-1">{entry.suggestion}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">Planner Notes</h4>
          <div className="mt-3 space-y-3">
            {plannerResult.recommendations.map((note, index) => (
              <div key={`${note}-${index}`} className="glass-subtle flex items-start gap-3 rounded-[1.2rem] p-4">
                <FiCheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
                <p className="text-sm text-slate-700 dark:text-slate-200">{note}</p>
              </div>
            ))}
            {!plannerResult.recommendations.length ? <p className="text-sm text-slate-500 dark:text-slate-400">Select menu items to start getting stocking guidance.</p> : null}
          </div>
        </div>

        {!canManageInventory ? (
          <div className="mt-5 rounded-[1.2rem] border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Kitchen staff can use this planner and live inventory visibility, but admin or manager accounts still control master inventory records.
          </div>
        ) : null}
      </article>
    </section>

    <section className="card-elevated p-6">
      <div className="flex items-center gap-3">
        <FiTrendingUp className="h-5 w-5 text-violet-500" />
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Selected Menu Snapshot</h3>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {plannerResult.selectedMenu.map((item) => (
          <article key={item._id} className="glass-subtle rounded-[1.3rem] p-4">
            <p className="font-black text-slate-900 dark:text-slate-50">{item.name}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.foodType === "veg" ? "Veg" : "Non-Veg"} • {item.courseLabel}</p>
          </article>
        ))}
        {!plannerResult.selectedMenu.length ? <p className="text-sm text-slate-500 dark:text-slate-400">Pick starters, mains, beverages, or desserts to generate planning output.</p> : null}
      </div>
    </section>
  </div>
);

export default InventoryPlannerView;

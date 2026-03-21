import { FiAlertTriangle, FiBarChart2, FiCamera, FiGrid, FiLayers, FiPackage, FiPieChart, FiPlus, FiTrendingUp, FiUploadCloud } from "react-icons/fi";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartPalette, titleize } from "./inventoryUtils";

const InventoryDashboardView = ({ summaryCards, categoryChartData, topValueItems, stockHealthData, lowStockItems, draftsCount, onOpenScanner, onOpenAddItem, onOpenItems, canManageInventory }) => (
  <div className="space-y-6">
    <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            Inventory Hub
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Inventory Dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            This is now the landing page for inventory. It brings live stock data, scan drafts, and future inventory features into one wired workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onOpenScanner} className="btn-outline inline-flex items-center gap-2">
            <FiUploadCloud className="h-4 w-4" />
            Scan Image
          </button>
          <button onClick={onOpenAddItem} disabled={!canManageInventory} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
            <FiPlus className="h-4 w-4" />
            {canManageInventory ? "Add Live Item" : "Admin/Manager Only"}
          </button>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {summaryCards.map((card, index) => {
        const iconMap = { FiPackage, FiAlertTriangle, FiTrendingUp, FiLayers, FiCamera, FiGrid };
        const Icon = iconMap[card.iconName] || FiGrid;
        return (
          <article key={card.label} className={`card-elevated animate-fade-in-up stagger-${(index % 3) + 1} smooth-transform p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{card.label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{card.value}</p>
              </div>
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </article>
        );
      })}
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiPieChart className="h-5 w-5 text-sky-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Category Distribution</h3>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55}>
                {categoryChartData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiBarChart2 className="h-5 w-5 text-emerald-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Top Inventory Value</h3>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topValueItems}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {topValueItems.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>

    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="card-elevated p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Stock Health</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Quick view of low, healthy, and full stock states.</p>
          </div>
          <button onClick={onOpenItems} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            Open Items
          </button>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stockHealthData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}>
                {stockHealthData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Attention Needed</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Low-stock items and unsaved scanner drafts show up here first.</p>
          </div>
          <span className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
            {lowStockItems.length} low / {draftsCount} drafts
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {lowStockItems.map((item) => (
            <article key={item._id} className="glass-subtle rounded-[1.3rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-50">{item.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {titleize(item.category)} • {item.currentStock} {item.unit}
                  </p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  Below min
                </span>
              </div>
            </article>
          ))}
          {!lowStockItems.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No live stock alerts right now.</p> : null}
        </div>
      </article>
    </section>
  </div>
);

export default InventoryDashboardView;

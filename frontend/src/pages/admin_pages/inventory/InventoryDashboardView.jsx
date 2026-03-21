import { FiActivity, FiAlertTriangle, FiBarChart2, FiCamera, FiClipboard, FiCreditCard, FiGrid, FiLayers, FiPackage, FiPieChart, FiPlus, FiShoppingBag, FiTrendingUp, FiTruck, FiUploadCloud } from "react-icons/fi";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartPalette, titleize } from "./inventoryUtils";

const sourceLabels = {
  order_served: "Order served",
  purchase_order_receipt: "PO receipt",
  manual_adjustment: "Manual",
  manual_restock: "Manual restock",
  scanner_draft_merge: "Scanner merge",
};

const statusTone = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
  ordered: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  partially_received: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const formatCompactDate = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

const InventoryDashboardView = ({ summaryCards, categoryChartData, topValueItems, categoryValueData, stockHealthData, lowStockItems, draftsCount, recentTransactions, topMovingItems, procurementInsights, dashboardAlerts, onOpenScanner, onOpenAddItem, onOpenItems, canManageInventory }) => (
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

    <section className="grid gap-6 xl:grid-cols-2">
      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiClipboard className="h-5 w-5 text-violet-500" />
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Inventory Value By Category</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Which categories are carrying the highest rupee value right now.</p>
          </div>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryValueData} layout="vertical" margin={{ left: 12, right: 12 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => `Rs ${Number(value || 0).toLocaleString()}`} />
              <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                {categoryValueData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiActivity className="h-5 w-5 text-cyan-500" />
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Fastest Moving Items</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Movement is based on recent stock history, both in and out.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {topMovingItems.map((item, index) => (
            <article key={item.id} className="glass-subtle rounded-[1.2rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-50">{index + 1}. {item.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.eventCount} movement event{item.eventCount > 1 ? "s" : ""} • In {item.inQuantity} {item.unit} • Out {item.outQuantity} {item.unit}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                  {item.moved.toFixed(1)} {item.unit}
                </span>
              </div>
            </article>
          ))}
          {!topMovingItems.length ? <p className="text-sm text-slate-500 dark:text-slate-400">Stock history has not built enough movement data yet.</p> : null}
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

    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <article className="card-elevated p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiTruck className="h-5 w-5 text-indigo-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Procurement Snapshot</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Supplier coverage, open purchase orders, pending payments, and receipts.</p>
            </div>
          </div>
          <span className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
            {procurementInsights.totalOrders} orders
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="glass-subtle rounded-[1.3rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Active Suppliers</p>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-50">{procurementInsights.activeSuppliersCount}</p>
          </article>
          <article className="glass-subtle rounded-[1.3rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Open Orders</p>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-50">{procurementInsights.openOrdersCount}</p>
          </article>
          <article className="glass-subtle rounded-[1.3rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Pending Receipts</p>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-50">{procurementInsights.pendingReceiptsCount}</p>
          </article>
          <article className="glass-subtle rounded-[1.3rem] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Balance Due</p>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-50">Rs {procurementInsights.totalDue.toLocaleString()}</p>
          </article>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 text-white/75">
              <FiShoppingBag className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Purchase Value</span>
            </div>
            <p className="mt-4 text-3xl font-black">Rs {procurementInsights.totalValue.toLocaleString()}</p>
            <p className="mt-2 text-sm text-white/75">Paid Rs {procurementInsights.totalPaid.toLocaleString()} • Due Rs {procurementInsights.totalDue.toLocaleString()}</p>
          </div>

          <div className="glass-subtle rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <FiCreditCard className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Supplier Exposure</span>
            </div>
            <div className="mt-4 space-y-3">
              {procurementInsights.supplierExposure.map((supplier) => (
                <article key={supplier.id} className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/70 px-4 py-3 dark:bg-slate-800/40">
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-50">{supplier.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {supplier.orders} order{supplier.orders > 1 ? "s" : ""} • Paid Rs {supplier.totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                    Due Rs {supplier.outstanding.toLocaleString()}
                  </span>
                </article>
              ))}
              {!procurementInsights.supplierExposure.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No supplier exposure data yet. Create purchase orders to populate this area.</p> : null}
            </div>
          </div>
        </div>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiAlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Operational Alerts</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">A compact list of what needs attention next.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {dashboardAlerts.map((alert) => (
            <article key={alert} className="glass-subtle rounded-[1.25rem] p-4">
              <p className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{alert}</p>
            </article>
          ))}
        </div>
      </article>
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiActivity className="h-5 w-5 text-sky-500" />
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Recent Stock Movements</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Latest live stock additions and deductions from the inventory ledger.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {recentTransactions.map((transaction) => (
            <article key={transaction.id} className="glass-subtle rounded-[1.25rem] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-50">{transaction.itemName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {sourceLabels[transaction.source] || titleize(String(transaction.source || "manual").replaceAll("_", " "))} • {formatCompactDate(transaction.createdAt)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${transaction.direction === "out" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
                  {transaction.direction === "out" ? "-" : "+"}
                  {transaction.quantity} {transaction.unit}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {transaction.reason || "No extra note"} • Resulting stock: {transaction.resultingStock} {transaction.unit}
              </p>
            </article>
          ))}
          {!recentTransactions.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No stock movement history is available yet.</p> : null}
        </div>
      </article>

      <article className="card-elevated p-6">
        <div className="flex items-center gap-3">
          <FiShoppingBag className="h-5 w-5 text-emerald-500" />
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Recent Purchase Orders</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Latest procurement entries with payment and receipt status.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {procurementInsights.recentOrders.map((order) => (
            <article key={order.id} className="glass-subtle rounded-[1.25rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-50">{order.orderNumber}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {order.supplierName} • {order.itemCount} line item{order.itemCount > 1 ? "s" : ""}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[order.status] || "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"}`}>
                  {titleize(String(order.status || "draft").replaceAll("_", " "))}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Total Rs {order.totalAmount.toLocaleString()} • Due Rs {order.balanceDue.toLocaleString()}
              </p>
            </article>
          ))}
          {!procurementInsights.recentOrders.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No purchase orders have been created yet.</p> : null}
        </div>
      </article>
    </section>
  </div>
);

export default InventoryDashboardView;

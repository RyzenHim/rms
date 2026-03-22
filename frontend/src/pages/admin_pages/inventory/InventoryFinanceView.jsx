import { useMemo, useState } from "react";
import { FiBarChart2, FiCalendar, FiCreditCard, FiDownload, FiDollarSign, FiPieChart, FiTrash2, FiTrendingUp } from "react-icons/fi";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartPalette, titleize } from "./inventoryUtils";

const formatCurrency = (value = 0) => `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const FinanceSummaryCard = ({ label, value, subtext, tone }) => (
  <article className="card-elevated p-5">
    <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
    <p className={`mt-3 text-3xl font-black tracking-tight ${tone}`}>{value}</p>
    <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{subtext}</p>
  </article>
);

const InventoryFinanceView = ({
  financeMetrics,
  financeFilters,
  setFinanceFilters,
  expenseForm,
  setExpenseForm,
  editingExpenseId,
  submitting,
  handleExpenseSubmit,
  resetExpenseForm,
  onEditExpense,
  onDeleteExpense,
  inventoryItems,
  onRecordWastage,
}) => {
  const [wastageForm, setWastageForm] = useState({
    inventoryItemId: "",
    quantity: "",
    reason: "Kitchen wastage",
    notes: "",
  });
  const [recordingWastage, setRecordingWastage] = useState(false);

  const expenseCategoryData = useMemo(() => {
    const grouped = financeMetrics.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [financeMetrics.expenses]);

  const exportDailyReport = () => {
    const closing = financeMetrics.dailyClosing;
    const rows = [
      ["Date", closing.date],
      ["Revenue", closing.revenue],
      ["Ingredient Cost", closing.ingredientCost],
      ["Gross Profit", closing.grossProfit],
      ["Extra Expenses", closing.extraExpenses],
      ["Wastage Cost", closing.wastageCost],
      ["Net Profit", closing.netProfit],
      ["Served Orders", closing.servedOrders],
      ["Paid Orders", closing.paidOrders],
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-daily-closing-${closing.date || "report"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitWastage = async (event) => {
    event.preventDefault();
    if (!wastageForm.inventoryItemId || !wastageForm.quantity) return;
    setRecordingWastage(true);
    try {
      await onRecordWastage({
        inventoryItemId: wastageForm.inventoryItemId,
        quantity: Number(wastageForm.quantity),
        reason: wastageForm.reason,
        notes: wastageForm.notes,
      });
      setWastageForm({
        inventoryItemId: "",
        quantity: "",
        reason: "Kitchen wastage",
        notes: "",
      });
    } finally {
      setRecordingWastage(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Inventory Finance
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Revenue, Cost & Closing</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              This section now combines served-order revenue, ingredient cost estimates, extra expense tracking, wastage cost, purchase comparison, and daily closing reporting.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="form-label">Specific Date</span>
              <input type="date" value={financeFilters.selectedDate} onChange={(event) => setFinanceFilters((prev) => ({ ...prev, selectedDate: event.target.value }))} className="input-base" />
            </label>
            <label className="space-y-2">
              <span className="form-label">Specific Month</span>
              <input type="month" value={financeFilters.selectedMonth} onChange={(event) => setFinanceFilters((prev) => ({ ...prev, selectedMonth: event.target.value }))} className="input-base" />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceSummaryCard label="Today Revenue" value={formatCurrency(financeMetrics.today.revenue)} subtext={`${financeMetrics.today.orderCount} served orders today`} tone="text-slate-900 dark:text-slate-50" />
        <FinanceSummaryCard label="Today Profit" value={formatCurrency(financeMetrics.today.profit - financeMetrics.todayExpenseTotal - financeMetrics.todayWastageCost)} subtext={`After expenses ${formatCurrency(financeMetrics.todayExpenseTotal)} and wastage ${formatCurrency(financeMetrics.todayWastageCost)}`} tone="text-emerald-600 dark:text-emerald-300" />
        <FinanceSummaryCard label="Selected Date Revenue" value={formatCurrency(financeMetrics.selectedDate.revenue)} subtext={`${financeMetrics.selectedDate.orderCount} served orders on selected date`} tone="text-slate-900 dark:text-slate-50" />
        <FinanceSummaryCard label="Selected Month Net Profit" value={formatCurrency(financeMetrics.selectedMonth.profit - financeMetrics.selectedMonthExpenseTotal - financeMetrics.selectedMonthWastageCost)} subtext={`Month margin after expense and wastage`} tone="text-sky-600 dark:text-sky-300" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiTrendingUp className="h-5 w-5 text-sky-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Last 7 Days</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Revenue and profit trend from served orders.</p>
            </div>
          </div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeMetrics.dailyTrend}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke={chartPalette[0]} fill={chartPalette[0]} fillOpacity={0.18} strokeWidth={3} />
                <Area type="monotone" dataKey="profit" stroke={chartPalette[1]} fill={chartPalette[1]} fillOpacity={0.14} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="h-5 w-5 text-emerald-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Last 6 Months</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Monthly revenue and profit view inside inventory.</p>
            </div>
          </div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeMetrics.monthlyTrend}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                  {financeMetrics.monthlyTrend.map((entry, index) => (
                    <Cell key={`${entry.label}-revenue`} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Bar>
                <Bar dataKey="profit" radius={[10, 10, 0, 0]} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiDollarSign className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Daily Closing Report</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Cashier and manager ready closing summary for the selected date.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Revenue</p><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{formatCurrency(financeMetrics.dailyClosing.revenue)}</p></article>
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ingredient Cost</p><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{formatCurrency(financeMetrics.dailyClosing.ingredientCost)}</p></article>
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Gross Profit</p><p className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-300">{formatCurrency(financeMetrics.dailyClosing.grossProfit)}</p></article>
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Extra Expenses</p><p className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-300">{formatCurrency(financeMetrics.dailyClosing.extraExpenses)}</p></article>
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Wastage Cost</p><p className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-300">{formatCurrency(financeMetrics.dailyClosing.wastageCost)}</p></article>
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Net Profit</p><p className="mt-3 text-2xl font-black text-sky-600 dark:text-sky-300">{formatCurrency(financeMetrics.dailyClosing.netProfit)}</p></article>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={exportDailyReport} className="btn-primary inline-flex items-center gap-2">
              <FiDownload className="h-4 w-4" />
              Download Closing Report
            </button>
            <span className="glass-pill rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              {financeMetrics.dailyClosing.servedOrders} served / {financeMetrics.dailyClosing.paidOrders} paid
            </span>
          </div>
        </article>

        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiCreditCard className="h-5 w-5 text-violet-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Purchase vs Sales</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Selected month inventory procurement compared with served-order sales.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sales Revenue</p><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{formatCurrency(financeMetrics.purchaseVsSales.selectedMonthSales)}</p></article>
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Purchase Orders</p><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{formatCurrency(financeMetrics.purchaseVsSales.selectedMonthPurchases)}</p></article>
            <article className="glass-subtle rounded-[1.2rem] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Supplier Payments</p><p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-50">{formatCurrency(financeMetrics.purchaseVsSales.selectedMonthPayments)}</p></article>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiPieChart className="h-5 w-5 text-violet-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Mix Insights</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Revenue by service type and served-order payment split.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={financeMetrics.serviceMix} dataKey="value" nameKey="name" outerRadius={78}>
                    {financeMetrics.serviceMix.map((entry, index) => (
                      <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {financeMetrics.paymentMix.map((entry) => (
                <article key={entry.name} className="glass-subtle rounded-[1rem] p-3">
                  <p className="font-black text-slate-900 dark:text-slate-50">{entry.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{entry.value} served orders</p>
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiPieChart className="h-5 w-5 text-rose-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Expense Split</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Recent extra expenses beyond food cost.</p>
            </div>
          </div>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseCategoryData} dataKey="value" nameKey="name" outerRadius={78}>
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="h-5 w-5 text-cyan-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Category Profit Ranking</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Estimated profit by ingredient/category contribution.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {financeMetrics.categoryProfitRanking.map((entry) => (
              <article key={entry.name} className="glass-subtle rounded-[1.2rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-50">{entry.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Revenue {formatCurrency(entry.revenue)} • Cost {formatCurrency(entry.cost)}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {formatCurrency(entry.profit)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiCalendar className="h-5 w-5 text-emerald-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Menu Item Profit Ranking</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Top menu items ranked by estimated profit.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {financeMetrics.menuItemProfitRanking.map((entry) => (
              <article key={entry.id} className="glass-subtle rounded-[1.2rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-50">{entry.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{entry.quantity} sold • Revenue {formatCurrency(entry.revenue)} • Cost {formatCurrency(entry.cost)}</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    {formatCurrency(entry.profit)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiDollarSign className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">{editingExpenseId ? "Edit Expense" : "Track Extra Expense"}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Add utilities, salaries, transport, packaging, maintenance, and other operating costs.</p>
            </div>
          </div>
          <form onSubmit={handleExpenseSubmit} className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className="form-label">Expense Title</span>
              <input value={expenseForm.title} onChange={(event) => setExpenseForm((prev) => ({ ...prev, title: event.target.value }))} className="input-base" placeholder="Enter expense title" required />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="form-label">Category</span>
                <select value={expenseForm.category} onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))} className="input-base">
                  {["Utilities", "Salary", "Rent", "Packaging", "Maintenance", "Logistics", "Marketing", "Other"].map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="form-label">Amount</span>
                <input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))} className="input-base" placeholder="Enter amount" required />
              </label>
              <label className="space-y-2">
                <span className="form-label">Expense Date</span>
                <input type="date" value={expenseForm.expenseDate} onChange={(event) => setExpenseForm((prev) => ({ ...prev, expenseDate: event.target.value }))} className="input-base" required />
              </label>
            </div>
            <label className="space-y-2">
              <span className="form-label">Notes</span>
              <textarea value={expenseForm.notes} onChange={(event) => setExpenseForm((prev) => ({ ...prev, notes: event.target.value }))} className="input-base min-h-[5rem]" placeholder="Expense notes" rows={3} />
            </label>
            <div className="flex flex-wrap gap-3">
              <button disabled={submitting} className="btn-primary">{submitting ? "Saving..." : editingExpenseId ? "Update Expense" : "Add Expense"}</button>
              <button type="button" onClick={resetExpenseForm} className="btn-outline">Reset</button>
            </div>
          </form>
        </article>

        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiTrash2 className="h-5 w-5 text-rose-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Record Wastage / Spoilage</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Subtract wasted stock and reflect its cost in the finance report.</p>
            </div>
          </div>
          <form onSubmit={submitWastage} className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className="form-label">Inventory Item</span>
              <select value={wastageForm.inventoryItemId} onChange={(event) => setWastageForm((prev) => ({ ...prev, inventoryItemId: event.target.value }))} className="input-base" required>
                <option value="">Select inventory item</option>
                {inventoryItems.map((item) => (
                  <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="form-label">Quantity</span>
                <input type="number" min="0.001" step="0.001" value={wastageForm.quantity} onChange={(event) => setWastageForm((prev) => ({ ...prev, quantity: event.target.value }))} className="input-base" placeholder="Enter wasted quantity" required />
              </label>
              <label className="space-y-2">
                <span className="form-label">Reason</span>
                <input value={wastageForm.reason} onChange={(event) => setWastageForm((prev) => ({ ...prev, reason: event.target.value }))} className="input-base" placeholder="Spoilage, breakage, overcooked batch..." required />
              </label>
            </div>
            <label className="space-y-2">
              <span className="form-label">Notes</span>
              <textarea value={wastageForm.notes} onChange={(event) => setWastageForm((prev) => ({ ...prev, notes: event.target.value }))} className="input-base min-h-[5rem]" placeholder="Extra wastage notes" rows={3} />
            </label>
            <button disabled={recordingWastage} className="btn-primary">{recordingWastage ? "Recording..." : "Record Wastage"}</button>
          </form>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiDollarSign className="h-5 w-5 text-sky-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Recent Expenses</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Manage tracked operating costs from inside inventory.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {financeMetrics.expenses.map((expense) => (
              <article key={expense._id} className="glass-subtle rounded-[1.2rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-50">{expense.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{expense.category} • {String(expense.expenseDate || "").slice(0, 10)}</p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{expense.notes || "No notes"}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onEditExpense(expense)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button>
                  <button type="button" onClick={() => onDeleteExpense(expense._id)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <FiTrash2 className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Recent Wastage Log</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Latest spoilage and wastage deductions with cost impact.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {financeMetrics.wastageEntries.map((entry) => (
              <article key={entry.id} className="glass-subtle rounded-[1.2rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-50">{entry.itemName}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{entry.quantity} {entry.unit} • {entry.reason}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    {formatCurrency(entry.cost)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{new Date(entry.createdAt).toLocaleString("en-IN")}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default InventoryFinanceView;

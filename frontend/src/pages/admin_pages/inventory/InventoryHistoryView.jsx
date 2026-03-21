import { FiActivity, FiArrowDownLeft, FiArrowUpRight, FiClock } from "react-icons/fi";

const InventoryHistoryView = ({ transactions = [] }) => (
  <div className="space-y-6">
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            Stock Ledger
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Inventory History</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Every manual adjustment and served-order deduction is recorded here so admin, kitchen, and cashier teams can trace how stock moved.
          </p>
        </div>
      </div>
    </section>

    <section className="card-elevated p-5">
      <div className="flex items-center gap-3">
        <FiActivity className="h-5 w-5 text-sky-500" />
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Recent Movements</h3>
      </div>

      <div className="mt-5 space-y-3">
        {transactions.map((transaction) => {
          const isInbound = transaction.direction === "in";
          const itemName = transaction.inventoryItem?.name || "Inventory item";
          const unit = transaction.inventoryItem?.unit || "";
          const actor = transaction.performedBy?.name || "System";
          const orderNumber = transaction.order?.orderNumber || "";

          return (
            <article key={transaction._id} className="glass-subtle rounded-[1.3rem] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${isInbound ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                    {isInbound ? <FiArrowUpRight className="h-5 w-5" /> : <FiArrowDownLeft className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-50">{itemName}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {isInbound ? "Added" : "Used"} {Number(transaction.quantity || 0).toFixed(2)} {unit} via {transaction.source.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {transaction.reason || "No reason added"} {orderNumber ? `| ${orderNumber}` : ""} {transaction.menuItemName ? `| ${transaction.menuItemName}` : ""}
                    </p>
                    {transaction.notes ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{transaction.notes}</p> : null}
                  </div>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Resulting stock: {Number(transaction.resultingStock || 0).toFixed(2)} {unit}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">By {actor}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <FiClock className="h-3.5 w-3.5" />
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          );
        })}

        {!transactions.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No stock transactions yet.</p> : null}
      </div>
    </section>
  </div>
);

export default InventoryHistoryView;

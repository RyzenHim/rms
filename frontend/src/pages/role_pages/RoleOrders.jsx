import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiClock, FiFilter, FiRefreshCw, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const statusOptions = ["all", "placed", "received", "preparing", "done_preparing", "served", "cancelled"];
const actionStatuses = ["received", "preparing", "done_preparing", "served", "cancelled"];

const todayString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

const statusBadgeClass = {
  placed: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  received: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  done_preparing: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  served: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const RoleOrders = ({ roleLabel }) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {
        ...(statusFilter === "all" ? {} : { status: statusFilter }),
        ...(selectedDate ? { date: selectedDate } : {}),
      };
      const res = await orderService.getOrders(token, params);
      setOrders(res.orders || []);
      setMessage("");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, [statusFilter, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id, status) => {
    try {
      await orderService.updateOrderStatus(token, id, status);
      setMessage(`Order status changed to ${status}`);
      await loadOrders();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Status update failed");
    }
  };

  const counts = useMemo(
    () =>
      statusOptions.reduce((acc, status) => {
        if (status === "all") {
          acc.all = orders.length;
          return acc;
        }
        acc[status] = orders.filter((order) => order.status === status).length;
        return acc;
      }, {}),
    [orders],
  );

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Order Command
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">{roleLabel} Orders</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Date-first order monitoring with a cleaner status workflow and theme-consistent surfaces.
            </p>
            {message ? <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{message}</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:w-[26rem]">
            <label className="glass-subtle flex items-center gap-3 rounded-[1.3rem] px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              <FiCalendar className="h-4 w-4" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-transparent outline-none" />
            </label>
            <button onClick={loadOrders} className="btn-secondary inline-flex items-center justify-center gap-2">
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="card-elevated animate-fade-in-up p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <FiFilter className="h-4 w-4" />
            Filter by status
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                  statusFilter === status ? "bg-slate-900 text-white shadow-lg dark:bg-sky-400 dark:text-slate-950" : "glass-pill text-slate-700 dark:text-slate-200"
                }`}
              >
                {status.replaceAll("_", " ")} ({counts[status] || 0})
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="glass-panel rounded-full p-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          </div>
        </div>
      ) : orders.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {orders.map((order, index) => (
            <article key={order._id} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-black text-slate-900 dark:text-slate-50">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Table {order.tableNumber}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass[order.status] || statusBadgeClass.placed}`}>
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="glass-subtle rounded-2xl p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Customer</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    <FiUser className="h-4 w-4" />
                    {order.customerName || "Guest"}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {order.customerPhone || "No phone"}{order.customerEmail ? ` | ${order.customerEmail}` : ""}
                  </p>
                </div>
                <div className="glass-subtle rounded-2xl p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Meta</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    <FiClock className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">By: {order.createdBy?.name || "Unknown"} • Rs {Number(order.grandTotal || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.4rem] bg-white/25 p-4 dark:bg-slate-900/20">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Items</p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {actionStatuses.map((status) => (
                  <button key={status} onClick={() => updateStatus(order._id, status)} className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    {status.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="card-elevated p-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          No orders found for {selectedDate || "the selected date"}.
        </div>
      )}
    </div>
  );
};

export default RoleOrders;

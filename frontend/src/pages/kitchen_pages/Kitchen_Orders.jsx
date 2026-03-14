import { useEffect, useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const statusColumns = ["placed", "received", "preparing", "done_preparing"];
const STORAGE_MODE_KEY = "kitchen_compact_mode";

const statusStyles = {
  placed: { label: "Placed", badge: "from-slate-700 to-slate-900", action: "Mark Received", actionClass: "from-slate-900 to-slate-700" },
  received: { label: "Received", badge: "from-amber-400 to-orange-500", action: "Start Preparing", actionClass: "from-amber-500 to-orange-600" },
  preparing: { label: "Preparing", badge: "from-sky-500 to-cyan-500", action: "Done Preparing", actionClass: "from-emerald-500 to-teal-600" },
  done_preparing: { label: "Ready", badge: "from-emerald-500 to-teal-500", action: "", actionClass: "" },
};

const Kitchen_Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [compactMode, setCompactMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_MODE_KEY);
    if (saved !== null) return saved === "true";
    return window.innerWidth <= 1024;
  });

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load kitchen orders");
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 7000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(STORAGE_MODE_KEY, String(compactMode));
  }, [compactMode]);

  const grouped = useMemo(() => {
    const map = {
      placed: [],
      received: [],
      preparing: [],
      done_preparing: [],
    };
    for (const order of orders) {
      if (map[order.status]) map[order.status].push(order);
    }
    return map;
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(token, orderId, status);
      setMessage(`Order moved to ${status.replaceAll("_", " ")}`);
      await loadOrders();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Status update failed");
    }
  };

  const nextStatusByCurrent = {
    placed: "received",
    received: "preparing",
    preparing: "done_preparing",
  };

  return (
    <div className={`space-y-6 ${compactMode ? "p-1" : ""}`}>
      <section className="glass-panel animate-rise-in rounded-[2rem] p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Kitchen Flow
            </span>
            <h2 className={`mt-3 font-black tracking-tight text-slate-900 dark:text-slate-50 ${compactMode ? "text-4xl" : "text-3xl md:text-4xl"}`}>
              Kitchen Order Board
            </h2>
            <p className={`mt-2 max-w-2xl leading-6 text-slate-600 dark:text-slate-300 ${compactMode ? "text-base" : "text-sm"}`}>
              Touch-friendly glass board for faster kitchen handoff, better status visibility, and smoother scanability on tablets.
            </p>
            {message ? <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{message}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCompactMode((prev) => !prev)}
              className="btn-secondary"
            >
              {compactMode ? "Switch Normal Mode" : "Switch Compact Mode"}
            </button>
            <button onClick={loadOrders} className="btn-secondary inline-flex items-center gap-2">
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className={compactMode ? "grid gap-4 md:grid-cols-2" : "grid gap-4 xl:grid-cols-4"}>
        {statusColumns.map((status, columnIndex) => {
          const config = statusStyles[status];
          return (
            <div key={status} className={`card-elevated animate-fade-in-up stagger-${(columnIndex % 4) + 1} ${compactMode ? "p-4" : "p-4"}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className={`${compactMode ? "text-lg" : "text-base"} font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200`}>
                    {config.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Orders in this preparation step</p>
                </div>
                <span className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-gradient-to-br px-3 py-1 text-sm font-black text-white ${config.badge}`}>
                  {grouped[status].length}
                </span>
              </div>

              <div className={compactMode ? "space-y-3" : "space-y-3"}>
                {grouped[status].map((order, index) => (
                  <article key={order._id} className={`glass-subtle animate-scale-in stagger-${(index % 4) + 1} rounded-[1.4rem] p-4 smooth-transform`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`${compactMode ? "text-base" : "text-sm"} font-black text-slate-900 dark:text-slate-50`}>
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          Table {order.tableNumber}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/20 bg-white/30 p-3 dark:bg-slate-900/20">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Items</p>
                      <p className={`mt-2 leading-6 text-slate-700 dark:text-slate-200 ${compactMode ? "text-sm" : "text-xs"}`}>
                        {order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                      </p>
                    </div>

                    <p className={`mt-3 text-slate-600 dark:text-slate-300 ${compactMode ? "text-sm" : "text-xs"}`}>
                      Waiter: {order.createdBy?.name || "Unknown"}
                    </p>

                    {nextStatusByCurrent[order.status] ? (
                      <button
                        onClick={() => updateStatus(order._id, nextStatusByCurrent[order.status])}
                        className={`mt-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r px-4 py-2.5 font-semibold text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 ${statusStyles[order.status].actionClass} ${compactMode ? "w-full text-base" : "text-sm"}`}
                      >
                        {statusStyles[order.status].action}
                      </button>
                    ) : null}
                  </article>
                ))}

                {!grouped[status].length ? (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-300/70 px-4 py-8 text-center text-sm font-semibold text-slate-400 dark:border-slate-700/70 dark:text-slate-500">
                    No orders
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Kitchen_Orders;

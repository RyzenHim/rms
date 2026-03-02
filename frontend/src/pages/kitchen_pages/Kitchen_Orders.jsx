import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const statusColumns = ["placed", "received", "preparing", "done_preparing"];
const STORAGE_MODE_KEY = "kitchen_compact_mode";

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
      setMessage(`Order moved to ${status}`);
      await loadOrders();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Status update failed");
    }
  };

  const actionButtons = (order) => {
    if (order.status === "placed") {
      return (
        <button
          onClick={() => updateStatus(order._id, "received")}
          className={`rounded-xl bg-slate-900 font-semibold text-white ${
            compactMode ? "px-5 py-3 text-base" : "px-3 py-1 text-xs"
          }`}
        >
          Mark Received
        </button>
      );
    }
    if (order.status === "received") {
      return (
        <button
          onClick={() => updateStatus(order._id, "preparing")}
          className={`rounded-xl bg-amber-600 font-semibold text-white ${
            compactMode ? "px-5 py-3 text-base" : "px-3 py-1 text-xs"
          }`}
        >
          Start Preparing
        </button>
      );
    }
    if (order.status === "preparing") {
      return (
        <button
          onClick={() => updateStatus(order._id, "done_preparing")}
          className={`rounded-xl bg-emerald-700 font-semibold text-white ${
            compactMode ? "px-5 py-3 text-base" : "px-3 py-1 text-xs"
          }`}
        >
          Done Preparing
        </button>
      );
    }
    return null;
  };

  return (
    <div className={compactMode ? "space-y-5 bg-slate-100 p-2" : "space-y-5"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={compactMode ? "text-4xl font-black text-slate-900" : "text-3xl font-black text-slate-900"}>
            Kitchen Order Board
          </h2>
          <p className={compactMode ? "mt-1 text-base text-slate-600" : "mt-1 text-sm text-slate-600"}>
            Incoming orders with touch-first compact mode for tablets.
          </p>
          {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCompactMode((prev) => !prev)}
            className={`rounded-xl border border-slate-300 font-semibold ${
              compactMode ? "px-5 py-3 text-base" : "px-4 py-2 text-sm"
            }`}
          >
            {compactMode ? "Switch Normal Mode" : "Switch Compact Mode"}
          </button>
          <button
            onClick={loadOrders}
            className={`rounded-xl border border-slate-300 font-semibold ${
              compactMode ? "px-5 py-3 text-base" : "px-4 py-2 text-sm"
            }`}
          >
            Refresh
          </button>
        </div>
      </div>

      <section className={compactMode ? "grid gap-4 md:grid-cols-2" : "grid gap-4 xl:grid-cols-4"}>
        {statusColumns.map((status) => (
          <div
            key={status}
            className={`rounded-2xl border border-slate-200 bg-white ${
              compactMode ? "p-4 shadow-md" : "p-3"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className={compactMode ? "text-lg font-black uppercase tracking-wide text-slate-700" : "text-sm font-black uppercase tracking-wide text-slate-700"}>
                {status.replaceAll("_", " ")}
              </h3>
              <span
                className={`rounded-full bg-slate-100 font-semibold text-slate-700 ${
                  compactMode ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
                }`}
              >
                {grouped[status].length}
              </span>
            </div>
            <div className={compactMode ? "space-y-3" : "space-y-2"}>
              {grouped[status].map((order) => (
                <article
                  key={order._id}
                  className={`rounded-xl border border-slate-200 bg-slate-50 ${
                    compactMode ? "p-4 text-sm" : "p-3 text-xs"
                  }`}
                >
                  <p className={compactMode ? "text-base font-black text-slate-900" : "font-bold text-slate-900"}>
                    {order.orderNumber} | Table {order.tableNumber}
                  </p>
                  <p className={compactMode ? "mt-2 text-sm text-slate-700" : "mt-1 text-slate-600"}>
                    {order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                  </p>
                  <p className={compactMode ? "mt-1 text-sm text-slate-600" : "mt-1 text-slate-500"}>
                    Waiter: {order.createdBy?.name || "Unknown"}
                  </p>
                  <div className="mt-3">{actionButtons(order)}</div>
                </article>
              ))}
              {!grouped[status].length ? (
                <p className={compactMode ? "text-sm text-slate-400" : "text-xs text-slate-400"}>No orders</p>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Kitchen_Orders;

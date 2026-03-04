import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const Manager_Dashboard = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load manager dashboard");
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const pendingKitchen = orders.filter((x) => ["placed", "received", "preparing"].includes(x.status)).length;
    const readyToServe = orders.filter((x) => x.status === "done_preparing").length;
    const servedToday = orders.filter((x) => x.status === "served").length;
    const revenue = orders.reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);
    return { pendingKitchen, readyToServe, servedToday, revenue };
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(token, orderId, status);
      setMessage(`Order moved to ${status}`);
      await loadOrders();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to update order status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Manager Control Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Live restaurant operations overview with quick workflow controls.</p>
        {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Kitchen Pending</p><p className="mt-1 text-3xl font-black text-slate-900">{stats.pendingKitchen}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Ready To Serve</p><p className="mt-1 text-3xl font-black text-slate-900">{stats.readyToServe}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Served Orders</p><p className="mt-1 text-3xl font-black text-slate-900">{stats.servedToday}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Tracked Revenue</p><p className="mt-1 text-3xl font-black text-slate-900">Rs {stats.revenue.toFixed(2)}</p></article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-xl font-bold text-slate-900">Recent Orders (Manager Actions)</h3>
        <div className="mt-3 space-y-2">
          {orders.slice(0, 12).map((order) => (
            <article key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{order.orderNumber} | Table {order.tableNumber}</p>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold">{order.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{order.items?.map((x) => `${x.name} x${x.quantity}`).join(", ")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["received", "preparing", "done_preparing", "served", "cancelled"].map((status) => (
                  <button key={status} onClick={() => updateStatus(order._id, status)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold">
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {!orders.length ? <p className="text-sm text-slate-500">No orders found.</p> : null}
        </div>
      </section>
    </div>
  );
};

export default Manager_Dashboard;

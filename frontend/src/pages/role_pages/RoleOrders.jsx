import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const statusOptions = ["all", "placed", "received", "preparing", "done_preparing", "served", "cancelled"];

const RoleOrders = ({ roleLabel }) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      const params = statusFilter === "all" ? {} : { status: statusFilter };
      const res = await orderService.getOrders(token, params);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id, status) => {
    try {
      await orderService.updateOrderStatus(token, id, status);
      setMessage(`Order status changed to ${status}`);
      await loadOrders();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Status update failed");
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-black text-slate-900">{roleLabel} Orders</h2>
      <p className="mt-2 text-slate-600">Track complete order lifecycle and customer progress.</p>
      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === status ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {orders.map((order) => (
          <article key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-slate-900">
                {order.orderNumber} | Table {order.tableNumber}
              </p>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold">{order.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Customer: {order.customerName || "Guest"} {order.customerPhone ? `| ${order.customerPhone}` : ""}{" "}
              {order.customerEmail ? `| ${order.customerEmail}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Items: {order.items?.map((x) => `${x.name} x${x.quantity}`).join(", ")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total: ${Number(order.grandTotal || 0).toFixed(2)} | By: {order.createdBy?.name || "Unknown"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["received", "preparing", "done_preparing", "served", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(order._id, status)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
        {!orders.length ? <p className="text-sm text-slate-500">No orders found.</p> : null}
      </div>
    </div>
  );
};

export default RoleOrders;

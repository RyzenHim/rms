import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const Customer_Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to load your orders");
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <h2 className="text-3xl font-black text-slate-900">My Order Progress</h2>
      <p className="mt-1 text-sm text-slate-600">Track status from placed to done preparing and served.</p>
      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}

      <div className="mt-5 space-y-2">
        {orders.map((order) => (
          <article key={order._id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900">{order.orderNumber}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{order.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">Table {order.tableNumber}</p>
            <p className="mt-1 text-xs text-slate-600">{order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
            <p className="mt-1 text-xs text-slate-500">Total: ${Number(order.grandTotal || 0).toFixed(2)}</p>
          </article>
        ))}
        {!orders.length ? <p className="text-sm text-slate-500">No orders yet.</p> : null}
      </div>
    </div>
  );
};

export default Customer_Orders;

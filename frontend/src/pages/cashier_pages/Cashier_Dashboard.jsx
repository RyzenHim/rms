import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const Cashier_Dashboard = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [methodMap, setMethodMap] = useState({});

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load cashier dashboard");
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { billQueue, paidOrders, pendingAmount, collectedAmount } = useMemo(() => {
    const served = orders.filter((x) => x.status === "served");
    const billQueue = served.filter((x) => x.paymentStatus !== "paid");
    const paidOrders = served.filter((x) => x.paymentStatus === "paid");
    const pendingAmount = billQueue.reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);
    const collectedAmount = paidOrders.reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);
    return { billQueue, paidOrders, pendingAmount, collectedAmount };
  }, [orders]);

  const markPaid = async (orderId) => {
    try {
      const paymentMethod = methodMap[orderId] || "cash";
      await orderService.updatePaymentStatus(token, orderId, { paymentStatus: "paid", paymentMethod });
      setMessage("Payment marked as paid");
      await loadOrders();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to update payment");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Cashier Billing Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Track served orders, collect payments and close billing queue.</p>
        {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Billing Queue</p><p className="mt-1 text-3xl font-black text-slate-900">{billQueue.length}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Paid Orders</p><p className="mt-1 text-3xl font-black text-slate-900">{paidOrders.length}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Pending Amount</p><p className="mt-1 text-3xl font-black text-slate-900">${pendingAmount.toFixed(2)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Collected</p><p className="mt-1 text-3xl font-black text-slate-900">${collectedAmount.toFixed(2)}</p></article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-xl font-bold text-slate-900">Ready For Billing</h3>
        <div className="mt-3 space-y-2">
          {billQueue.map((order) => (
            <article key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{order.orderNumber} | Table {order.tableNumber}</p>
                <p className="font-black text-slate-900">${Number(order.grandTotal || 0).toFixed(2)}</p>
              </div>
              <p className="mt-1 text-xs text-slate-600">Customer: {order.customerName || "Guest"} {order.customerPhone ? `| ${order.customerPhone}` : ""}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={methodMap[order._id] || "cash"}
                  onChange={(e) => setMethodMap((prev) => ({ ...prev, [order._id]: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
                <button onClick={() => markPaid(order._id)} className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">
                  Mark Paid
                </button>
              </div>
            </article>
          ))}
          {!billQueue.length ? <p className="text-sm text-slate-500">No pending bills.</p> : null}
        </div>
      </section>
    </div>
  );
};

export default Cashier_Dashboard;

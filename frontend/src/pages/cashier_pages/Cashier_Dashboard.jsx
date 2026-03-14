import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiCreditCard, FiDollarSign, FiRefreshCw, FiShoppingBag } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const paymentMethods = ["cash", "card", "upi", "other"];

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
    const served = orders.filter((item) => item.status === "served");
    const waiting = served.filter((item) => item.paymentStatus !== "paid");
    const paid = served.filter((item) => item.paymentStatus === "paid");
    return {
      billQueue: waiting,
      paidOrders: paid,
      pendingAmount: waiting.reduce((sum, item) => sum + Number(item.grandTotal || 0), 0),
      collectedAmount: paid.reduce((sum, item) => sum + Number(item.grandTotal || 0), 0),
    };
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

  const overviewCards = [
    { label: "Billing Queue", value: billQueue.length, icon: FiShoppingBag, gradient: "from-sky-500 to-cyan-400" },
    { label: "Paid Orders", value: paidOrders.length, icon: FiCheckCircle, gradient: "from-emerald-500 to-teal-400" },
    { label: "Pending Amount", value: `Rs ${pendingAmount.toFixed(2)}`, icon: FiDollarSign, gradient: "from-amber-400 to-orange-500" },
    { label: "Collected", value: `Rs ${collectedAmount.toFixed(2)}`, icon: FiCreditCard, gradient: "from-fuchsia-500 to-violet-500" },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Payments Control
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Cashier Billing Dashboard</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Monitor the served-order queue, collect payments quickly, and keep the billing desk responsive during rush hours.
            </p>
            {message ? <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{message}</p> : null}
          </div>
          <button onClick={loadOrders} className="btn-secondary inline-flex items-center justify-center gap-2 self-start">
            <FiRefreshCw className="h-4 w-4" />
            Refresh Queue
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`card-elevated animate-fade-in-up stagger-${Math.min(index + 1, 4)} smooth-transform p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{card.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{card.value}</p>
                </div>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card-elevated animate-scale-in p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Ready For Billing</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Compact payment cards for quick settlement without visual clutter.</p>
          </div>
          <span className="glass-pill inline-flex w-fit rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
            {billQueue.length} pending
          </span>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {billQueue.map((order, index) => (
            <article key={order._id} className={`glass-subtle animate-fade-in-up stagger-${(index % 4) + 1} rounded-[1.6rem] p-4 smooth-transform`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-50">{order.orderNumber}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">Table {order.tableNumber} • {order.customerName || "Guest"}</p>
                  {order.customerPhone ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.customerPhone}</p> : null}
                </div>
                <div className="rounded-2xl bg-slate-900 px-4 py-2 text-right text-white shadow-lg dark:bg-sky-400 dark:text-slate-950">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">Due</p>
                  <p className="text-lg font-black">Rs {Number(order.grandTotal || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/20 bg-white/30 p-3 dark:bg-slate-900/20">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Items</p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "No items listed"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <select
                  value={methodMap[order._id] || "cash"}
                  onChange={(e) => setMethodMap((prev) => ({ ...prev, [order._id]: e.target.value }))}
                  className="input-base min-w-[11rem] max-w-[13rem] text-sm capitalize"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <button onClick={() => markPaid(order._id)} className="btn-primary inline-flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4" />
                  Mark Paid
                </button>
              </div>
            </article>
          ))}
        </div>

        {!billQueue.length ? (
          <div className="mt-5 rounded-[1.6rem] border border-dashed border-slate-300/70 px-5 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
            No pending bills in the queue.
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default Cashier_Dashboard;

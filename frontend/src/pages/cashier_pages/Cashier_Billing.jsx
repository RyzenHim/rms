import { useEffect, useMemo, useState } from "react";
import { FiCreditCard, FiFileText, FiSearch } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const Cashier_Billing = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [methodMap, setMethodMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredOrders = useMemo(() => {
    const servedOrders = orders.filter((order) => order.status === "served");
    let result = [];
    if (activeTab === "queue") result = servedOrders.filter((order) => order.paymentStatus !== "paid");
    else if (activeTab === "served") result = servedOrders;
    else result = orders;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(term) ||
          String(order.tableNumber || "").toLowerCase().includes(term) ||
          order.customerName?.toLowerCase().includes(term) ||
          order.customerPhone?.includes(term),
      );
    }
    return result;
  }, [activeTab, orders, searchTerm]);

  const stats = useMemo(() => {
    const served = orders.filter((order) => order.status === "served");
    const unpaid = served.filter((order) => order.paymentStatus !== "paid");
    const paid = served.filter((order) => order.paymentStatus === "paid");
    return {
      queueCount: unpaid.length,
      paidCount: paid.length,
      servedCount: served.length,
      pendingAmount: unpaid.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0),
      collectedAmount: paid.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0),
    };
  }, [orders]);

  const markPaid = async (orderId) => {
    try {
      setLoading(true);
      const paymentMethod = methodMap[orderId] || "cash";
      await orderService.updatePaymentStatus(token, orderId, { paymentStatus: "paid", paymentMethod });
      setMessage("Payment marked as paid successfully");
      await loadOrders();
      setMethodMap((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to update payment");
    } finally {
      setLoading(false);
    }
  };

  const generateBill = (order) =>
    `
========================================
            BILL RECEIPT
========================================
Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Time: ${new Date(order.createdAt).toLocaleTimeString()}
----------------------------------------
Table: ${order.tableNumber}
Customer: ${order.customerName || "Guest"}
${order.customerPhone ? `Phone: ${order.customerPhone}` : ""}
----------------------------------------
ITEMS:
${order.items?.map((item) => `${item.name} x${item.quantity} = Rs ${item.totalPrice.toFixed(2)}`).join("\n")}
----------------------------------------
Subtotal:        Rs ${order.subTotal?.toFixed(2) || "0.00"}
Tax (5%):        Rs ${order.taxAmount?.toFixed(2) || "0.00"}
----------------------------------------
GRAND TOTAL:     Rs ${order.grandTotal?.toFixed(2) || "0.00"}
----------------------------------------
Payment Status:  ${order.paymentStatus?.toUpperCase() || "PENDING"}
Payment Method: ${order.paymentMethod || "N/A"}
${order.paidAt ? `Paid At: ${new Date(order.paidAt).toLocaleString()}` : ""}
========================================
      Thank You! Visit Again!
========================================
`.trim();

  const printBill = (order) => {
    const billText = generateBill(order);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; white-space: pre-wrap; padding: 20px; max-width: 400px; margin: 0 auto; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${billText}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatTime = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "");

  const getPaymentBadge = (status) => {
    const badges = {
      pending: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
      paid: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
      refunded: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    };
    return badges[status] || badges.pending;
  };

  const tabConfig = [
    { id: "queue", label: "Billing Queue", count: stats.queueCount },
    { id: "served", label: "All Served", count: stats.servedCount },
    { id: "all", label: "All Orders", count: orders.length },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
            Billing Control
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Cashier Billing</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Review served orders, generate receipts, and settle payments from a cleaner billing workspace.</p>
          {message ? <div className={`mt-4 ${message.toLowerCase().includes("success") || message.toLowerCase().includes("paid") ? "alert-success" : "alert-error"}`}>{message}</div> : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Billing Queue", value: stats.queueCount, sub: "Pending payment", tone: "from-amber-400 to-orange-500" },
          { label: "Paid Orders", value: stats.paidCount, sub: "Completed", tone: "from-emerald-500 to-teal-400" },
          { label: "Pending Amount", value: `Rs ${stats.pendingAmount.toFixed(2)}`, sub: "Awaiting collection", tone: "from-fuchsia-500 to-violet-500" },
          { label: "Collected", value: `Rs ${stats.collectedAmount.toFixed(2)}`, sub: "Settled revenue", tone: "from-sky-500 to-cyan-400" },
        ].map((card, index) => (
          <article key={card.label} className={`card-elevated animate-fade-in-up stagger-${Math.min(index + 1, 4)} smooth-transform p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{card.label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{card.value}</p>
                <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{card.sub}</p>
              </div>
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                <FiCreditCard className="h-6 w-6" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="card-elevated animate-fade-in-up p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === tab.id ? "bg-slate-900 text-white shadow-lg dark:bg-sky-400 dark:text-slate-950" : "glass-pill text-slate-700 dark:text-slate-200"}`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search order, table, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-11"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredOrders.map((order, index) => (
          <article key={order._id} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} p-5 ${selectedOrder?._id === order._id ? "ring-2 ring-sky-400/50" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-black text-slate-900 dark:text-slate-50">{order.orderNumber}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Table {order.tableNumber} • {formatDate(order.createdAt)} • {formatTime(order.createdAt)}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getPaymentBadge(order.paymentStatus)}`}>{order.paymentStatus?.toUpperCase() || "PENDING"}</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="glass-subtle rounded-2xl p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Customer</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{order.customerName || "Guest"}</p>
                {order.customerPhone ? <p className="text-sm text-slate-600 dark:text-slate-300">{order.customerPhone}</p> : null}
              </div>

              <div className="glass-subtle rounded-2xl p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Items</p>
                <div className="max-h-24 space-y-1 overflow-auto">
                  {order.items?.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between gap-2 text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{item.name} x{item.quantity}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">Rs {item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-subtle rounded-2xl p-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Subtotal</span><span className="text-slate-900 dark:text-slate-50">Rs {order.subTotal?.toFixed(2) || "0.00"}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-slate-600 dark:text-slate-300">Tax (5%)</span><span className="text-slate-900 dark:text-slate-50">Rs {order.taxAmount?.toFixed(2) || "0.00"}</span></div>
                <div className="mt-3 flex justify-between border-t border-slate-200/60 pt-3 dark:border-slate-700/60"><span className="font-bold text-slate-900 dark:text-slate-50">Total</span><span className="text-lg font-black text-emerald-600">Rs {order.grandTotal?.toFixed(2) || "0.00"}</span></div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setSelectedOrder(order)} className="btn-outline flex-1 text-xs">View Details</button>
              <button onClick={() => printBill(order)} className="btn-secondary flex-1 text-xs inline-flex items-center justify-center gap-2"><FiFileText className="h-4 w-4" />Generate Bill</button>
              {order.paymentStatus !== "paid" ? <button onClick={() => markPaid(order._id)} disabled={loading} className="btn-primary flex-1 text-xs disabled:opacity-50">Mark Paid</button> : null}
            </div>

            {order.paymentStatus !== "paid" ? (
              <div className="mt-3">
                <select value={methodMap[order._id] || "cash"} onChange={(e) => setMethodMap((prev) => ({ ...prev, [order._id]: e.target.value }))} className="input-base text-sm">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl bg-emerald-100/70 px-4 py-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                Paid by {order.paymentMethod?.toUpperCase() || "Unknown"}{order.paidAt ? ` at ${new Date(order.paidAt).toLocaleString()}` : ""}
              </div>
            )}
          </article>
        ))}

        {!filteredOrders.length ? <div className="col-span-full rounded-[1.75rem] border border-dashed border-slate-300/70 px-5 py-12 text-center text-sm font-semibold text-slate-500 dark:border-slate-700/70 dark:text-slate-400">No orders found.</div> : null}
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">Order Details</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="glass-pill rounded-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200">Close</button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-3 rounded-[1.5rem] bg-white/25 p-4 sm:grid-cols-2 dark:bg-slate-900/20">
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Table</p><p className="font-semibold text-slate-900 dark:text-slate-50">{selectedOrder.tableNumber}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Date & Time</p><p className="font-semibold text-slate-900 dark:text-slate-50">{formatDate(selectedOrder.createdAt)} {formatTime(selectedOrder.createdAt)}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Customer</p><p className="font-semibold text-slate-900 dark:text-slate-50">{selectedOrder.customerName || "Guest"}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Phone</p><p className="font-semibold text-slate-900 dark:text-slate-50">{selectedOrder.customerPhone || "N/A"}</p></div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/60">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 border-b border-slate-200/50 p-4 last:border-b-0 dark:border-slate-700/50">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Rs {item.unitPrice?.toFixed(2)} x {item.quantity}{item.notes ? ` (${item.notes})` : ""}</p>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">Rs {item.totalPrice?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] bg-white/25 p-4 dark:bg-slate-900/20">
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">Subtotal</span><span className="text-slate-900 dark:text-slate-50">Rs {selectedOrder.subTotal?.toFixed(2)}</span></div>
                <div className="mt-1 flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">Tax (5%)</span><span className="text-slate-900 dark:text-slate-50">Rs {selectedOrder.taxAmount?.toFixed(2)}</span></div>
                <div className="mt-3 flex justify-between border-t border-slate-200/60 pt-3 dark:border-slate-700/60"><span className="text-lg font-bold text-slate-900 dark:text-slate-50">Grand Total</span><span className="text-xl font-black text-emerald-600">Rs {selectedOrder.grandTotal?.toFixed(2)}</span></div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => printBill(selectedOrder)} className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"><FiFileText className="h-4 w-4" />Generate & Print Bill</button>
                {selectedOrder.paymentStatus !== "paid" ? (
                  <div className="flex flex-1 gap-2">
                    <select value={methodMap[selectedOrder._id] || "cash"} onChange={(e) => setMethodMap((prev) => ({ ...prev, [selectedOrder._id]: e.target.value }))} className="input-base">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="other">Other</option>
                    </select>
                    <button onClick={() => markPaid(selectedOrder._id)} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">Mark as Paid</button>
                  </div>
                ) : (
                  <div className="flex-1 rounded-[1.25rem] bg-emerald-100/70 px-4 py-3 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Paid by {selectedOrder.paymentMethod?.toUpperCase()}{selectedOrder.paidAt ? ` at ${new Date(selectedOrder.paidAt).toLocaleString()}` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Cashier_Billing;

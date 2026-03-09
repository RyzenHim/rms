import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const Cashier_Billing = () => {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("queue"); // queue | served | all
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

    // Filter orders based on active tab
    const filteredOrders = useMemo(() => {
        const servedOrders = orders.filter((x) => x.status === "served");
        let result = [];

        if (activeTab === "queue") {
            // Show unpaid served orders (billing queue)
            result = servedOrders.filter((x) => x.paymentStatus !== "paid");
        } else if (activeTab === "served") {
            // Show all served orders (paid and unpaid)
            result = servedOrders;
        } else {
            // Show all orders
            result = orders;
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (order) =>
                    order.orderNumber?.toLowerCase().includes(term) ||
                    order.tableNumber?.toLowerCase().includes(term) ||
                    order.customerName?.toLowerCase().includes(term) ||
                    order.customerPhone?.includes(term)
            );
        }

        return result;
    }, [orders, activeTab, searchTerm]);

    // Statistics
    const stats = useMemo(() => {
        const served = orders.filter((x) => x.status === "served");
        const unpaid = served.filter((x) => x.paymentStatus !== "paid");
        const paid = served.filter((x) => x.paymentStatus === "paid");

        const pendingAmount = unpaid.reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);
        const collectedAmount = paid.reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);
        const totalServedAmount = served.reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);

        return {
            queueCount: unpaid.length,
            paidCount: paid.length,
            servedCount: served.length,
            pendingAmount,
            collectedAmount,
            totalServedAmount,
        };
    }, [orders]);

    const markPaid = async (orderId) => {
        try {
            setLoading(true);
            const paymentMethod = methodMap[orderId] || "cash";
            await orderService.updatePaymentStatus(token, orderId, {
                paymentStatus: "paid",
                paymentMethod
            });
            setMessage("Payment marked as paid successfully!");
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

    const generateBill = (order) => {
        return `
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
${order.items?.map((item) =>
            `${item.name} x${item.quantity} = Rs ${item.totalPrice.toFixed(2)}`
        ).join("\n")}
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
    };

    const printBill = (order) => {
        const billText = generateBill(order);
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${order.orderNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              white-space: pre-wrap;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${billText}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const formatTime = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString();
    };

    const getPaymentBadge = (status) => {
        const badges = {
            pending: "bg-amber-100 text-amber-700 border-amber-300",
            paid: "bg-emerald-100 text-emerald-700 border-emerald-300",
            refunded: "bg-red-100 text-red-700 border-red-300",
        };
        return badges[status] || badges.pending;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-slate-900">Cashier Billing</h2>
                <p className="mt-1 text-sm text-slate-600">
                    View served orders, generate bills, and collect payments.
                </p>
                {message && (
                    <p className={`mt-2 text-sm ${message.includes("success") ? "text-emerald-600" : "text-red-600"}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* Statistics Cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Billing Queue</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{stats.queueCount}</p>
                    <p className="text-xs text-amber-600">Pending Payment</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Paid Orders</p>
                    <p className="mt-1 text-3xl font-black text-emerald-600">{stats.paidCount}</p>
                    <p className="text-xs text-emerald-600">Completed</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Pending Amount</p>
                    <p className="mt-1 text-3xl font-black text-amber-600">Rs {stats.pendingAmount.toFixed(2)}</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Collected</p>
                    <p className="mt-1 text-3xl font-black text-emerald-600">Rs {stats.collectedAmount.toFixed(2)}</p>
                </article>
            </section>

            {/* Tabs and Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {[
                        { id: "queue", label: "Billing Queue", count: stats.queueCount },
                        { id: "served", label: "All Served", count: stats.servedCount },
                        { id: "all", label: "All Orders", count: orders.length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === tab.id
                                    ? "bg-emerald-700 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search order, table, customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredOrders.map((order) => (
                    <article
                        key={order._id}
                        className={`rounded-xl border bg-white p-4 transition-all hover:shadow-md ${selectedOrder?._id === order._id
                                ? "border-emerald-500 ring-2 ring-emerald-200"
                                : "border-slate-200"
                            }`}
                    >
                        {/* Order Header */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-mono text-lg font-bold text-slate-900">{order.orderNumber}</p>
                                <p className="text-sm text-slate-600">
                                    Table {order.tableNumber} • {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                                </p>
                            </div>
                            <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getPaymentBadge(order.paymentStatus)}`}>
                                {order.paymentStatus?.toUpperCase() || "PENDING"}
                            </span>
                        </div>

                        {/* Customer Info */}
                        <div className="mt-3 border-t border-slate-100 pt-3">
                            <p className="text-sm">
                                <span className="font-medium text-slate-700">Customer:</span>{" "}
                                <span className="text-slate-900">{order.customerName || "Guest"}</span>
                            </p>
                            {order.customerPhone && (
                                <p className="text-sm">
                                    <span className="font-medium text-slate-700">Phone:</span>{" "}
                                    <span className="text-slate-900">{order.customerPhone}</span>
                                </p>
                            )}
                        </div>

                        {/* Items Summary */}
                        <div className="mt-3 border-t border-slate-100 pt-3">
                            <p className="mb-2 text-xs font-semibold text-slate-700">Items:</p>
                            <div className="max-h-24 space-y-1 overflow-auto">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-slate-600">
                                            {item.name} x{item.quantity}
                                        </span>
                                        <span className="font-medium text-slate-900">Rs {item.totalPrice.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="mt-3 border-t border-slate-100 pt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Subtotal:</span>
                                <span className="text-slate-900">Rs {order.subTotal?.toFixed(2) || "0.00"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Tax (5%):</span>
                                <span className="text-slate-900">Rs {order.taxAmount?.toFixed(2) || "0.00"}</span>
                            </div>
                            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                                <span className="text-lg font-bold text-slate-900">Total:</span>
                                <span className="text-lg font-black text-emerald-700">Rs {order.grandTotal?.toFixed(2) || "0.00"}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedOrder(order)}
                                className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                View Details
                            </button>
                            <button
                                onClick={() => printBill(order)}
                                className="flex-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                                Generate Bill
                            </button>
                            {order.paymentStatus !== "paid" && (
                                <button
                                    onClick={() => markPaid(order._id)}
                                    disabled={loading}
                                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    Mark Paid
                                </button>
                            )}
                        </div>

                        {/* Payment Method Selection (for unpaid orders) */}
                        {order.paymentStatus !== "paid" && (
                            <div className="mt-3">
                                <select
                                    value={methodMap[order._id] || "cash"}
                                    onChange={(e) => setMethodMap((prev) => ({ ...prev, [order._id]: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        )}

                        {/* Payment Info */}
                        {order.paymentStatus === "paid" && (
                            <div className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs">
                                <p className="font-medium text-emerald-700">
                                    Paid by {order.paymentMethod?.toUpperCase() || "Unknown"}
                                    {order.paidAt && ` at ${new Date(order.paidAt).toLocaleString()}`}
                                </p>
                            </div>
                        )}
                    </article>
                ))}

                {!filteredOrders.length && (
                    <div className="col-span-full py-12 text-center">
                        <p className="text-slate-500">No orders found.</p>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Order Details</h3>
                                <p className="text-sm text-slate-600">{selectedOrder.orderNumber}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                                <div>
                                    <p className="text-xs text-slate-500">Table</p>
                                    <p className="font-semibold text-slate-900">{selectedOrder.tableNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Date & Time</p>
                                    <p className="font-semibold text-slate-900">
                                        {formatDate(selectedOrder.createdAt)} {formatTime(selectedOrder.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Customer</p>
                                    <p className="font-semibold text-slate-900">{selectedOrder.customerName || "Guest"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="font-semibold text-slate-900">{selectedOrder.customerPhone || "N/A"}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <p className="mb-2 text-sm font-semibold text-slate-700">Items Ordered</p>
                                <div className="space-y-2 rounded-lg border border-slate-200">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b border-slate-100 p-3 last:border-0">
                                            <div>
                                                <p className="font-medium text-slate-900">{item.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    Rs {item.unitPrice?.toFixed(2)} x {item.quantity}
                                                    {item.notes && <span className="ml-2 italic">({item.notes})</span>}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-slate-900">Rs {item.totalPrice?.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="rounded-lg bg-slate-50 p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal</span>
                                    <span className="text-slate-900">Rs {selectedOrder.subTotal?.toFixed(2)}</span>
                                </div>
                                <div className="mt-1 flex justify-between text-sm">
                                    <span className="text-slate-600">Tax (5%)</span>
                                    <span className="text-slate-900">Rs {selectedOrder.taxAmount?.toFixed(2)}</span>
                                </div>
                                <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
                                    <span className="text-lg font-bold text-slate-900">Grand Total</span>
                                    <span className="text-xl font-black text-emerald-700">Rs {selectedOrder.grandTotal?.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={() => printBill(selectedOrder)}
                                    className="flex-1 rounded-lg border border-blue-300 bg-blue-50 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                    Generate & Print Bill
                                </button>
                                {selectedOrder.paymentStatus !== "paid" ? (
                                    <div className="flex flex-1 gap-2">
                                        <select
                                            value={methodMap[selectedOrder._id] || "cash"}
                                            onChange={(e) => setMethodMap((prev) => ({ ...prev, [selectedOrder._id]: e.target.value }))}
                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="upi">UPI</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <button
                                            onClick={() => markPaid(selectedOrder._id)}
                                            disabled={loading}
                                            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            Mark as Paid
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 rounded-lg bg-emerald-50 py-3 text-center">
                                        <p className="text-sm font-semibold text-emerald-700">
                                            ✓ Paid by {selectedOrder.paymentMethod?.toUpperCase()}
                                            {selectedOrder.paidAt && ` at ${new Date(selectedOrder.paidAt).toLocaleString()}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cashier_Billing;


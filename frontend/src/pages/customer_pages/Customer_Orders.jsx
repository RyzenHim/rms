import { useEffect, useState } from "react";
import { FiClock, FiClipboard, FiDollarSign, FiGrid, FiInbox, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

const Customer_Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const { palette } = useResolvedColorMode({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800" },
      confirmed: { color: "bg-blue-100 text-blue-800" },
      preparing: { color: "bg-orange-100 text-orange-800" },
      ready: { color: "bg-green-100 text-green-800" },
      served: { color: "bg-emerald-100 text-emerald-800" },
      cancelled: { color: "bg-red-100 text-red-700" },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <section className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="mb-8 space-y-2">
          <h1 className="inline-flex items-center gap-2 heading-1" style={{ color: palette.text }}>
            <FiClipboard className="h-7 w-7" />
            Order History
          </h1>
          <p className="text-lg" style={{ color: palette.muted }}>Track the status of your orders from placement to completion.</p>
        </div>

        {message && <div className="alert-error mb-6">{message}</div>}

        <div className="space-y-4">
          {orders.length ? (
            orders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <article key={order._id} className="card-elevated space-y-4 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h2 className="heading-4" style={{ color: palette.text }}>{order.orderNumber}</h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge.color}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="inline-flex items-center gap-2 text-sm" style={{ color: palette.muted }}>
                        <FiClock className="h-4 w-4" />
                        {orderDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="inline-flex items-center gap-1 heading-5" style={{ color: "#10b981" }}>
                        <FiDollarSign className="h-4 w-4" />
                        {Number(order.grandTotal || 0).toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: palette.muted }}>Table {order.tableNumber}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4" style={{ borderColor: palette.border }}>
                    <h3 className="mb-3 inline-flex items-center gap-2 heading-5" style={{ color: palette.text }}>
                      <FiGrid className="h-4 w-4" />
                      Items Ordered
                    </h3>
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: palette.cardBg }}>
                          <div>
                            <p className="font-semibold" style={{ color: palette.text }}>{item.name}</p>
                            <p className="text-xs" style={{ color: palette.muted }}>Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold" style={{ color: "#10b981" }}>
                            {Number(item.unitPrice * item.quantity || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-lg p-3" style={{ backgroundColor: palette.cardBg }}>
                      <p className="mb-1 text-xs font-semibold" style={{ color: palette.muted }}>Customer</p>
                      <p className="inline-flex items-center gap-2 font-semibold" style={{ color: palette.text }}><FiUser className="h-4 w-4" />{order.customerName}</p>
                      <p className="inline-flex items-center gap-2 text-xs" style={{ color: palette.muted }}><FiPhone className="h-3 w-3" />{order.customerPhone || "N/A"}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ backgroundColor: palette.cardBg }}>
                      <p className="mb-1 text-xs font-semibold" style={{ color: palette.muted }}>Contact</p>
                      <p className="inline-flex items-center gap-2 text-xs break-all" style={{ color: palette.text }}><FiMail className="h-3 w-3" />{order.customerEmail || "N/A"}</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="rounded-lg border-l-4 p-3" style={{ borderColor: "#0b6b49", backgroundColor: palette.cardBg }}>
                      <p className="text-xs font-semibold" style={{ color: palette.muted }}>Special Requests</p>
                      <p className="mt-1 text-sm" style={{ color: palette.text }}>{order.notes}</p>
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <div className="card-elevated space-y-4 p-12 text-center" style={{ backgroundColor: palette.panelBg }}>
              <FiInbox className="mx-auto h-10 w-10" style={{ color: palette.muted }} />
              <p className="heading-4" style={{ color: palette.text }}>No Orders Yet</p>
              <p style={{ color: palette.muted }}>Start ordering from the menu to see your history.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Customer_Orders;

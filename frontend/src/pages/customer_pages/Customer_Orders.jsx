import { useEffect, useState } from "react";
import { FiClock, FiClipboard, FiGrid, FiInbox, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";
import themeService from "../../services/theme_Service";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

const Customer_Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });
  const { palette, resolvedMode } = useResolvedColorMode(theme);

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to load your orders");
    }
  };

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((data) => {
        if (data?.theme) setTheme((prev) => ({ ...prev, ...data.theme }));
      })
      .catch(() => {});

    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusBadge = (status) => {
    const statusConfig = {
      placed: { bg: resolvedMode === "dark" ? "#1e293b" : "#e2e8f0", text: resolvedMode === "dark" ? "#cbd5e1" : "#334155", label: "Placed" },
      received: { bg: resolvedMode === "dark" ? "#172554" : "#dbeafe", text: resolvedMode === "dark" ? "#93c5fd" : "#1d4ed8", label: "Received" },
      preparing: { bg: resolvedMode === "dark" ? "#431407" : "#ffedd5", text: resolvedMode === "dark" ? "#fdba74" : "#c2410c", label: "Preparing" },
      done_preparing: { bg: resolvedMode === "dark" ? "#052e16" : "#dcfce7", text: resolvedMode === "dark" ? "#86efac" : "#15803d", label: "Ready To Serve" },
      served: { bg: resolvedMode === "dark" ? "#022c22" : "#d1fae5", text: resolvedMode === "dark" ? "#6ee7b7" : "#047857", label: "Served" },
      cancelled: { bg: resolvedMode === "dark" ? "#450a0a" : "#fee2e2", text: resolvedMode === "dark" ? "#fca5a5" : "#b91c1c", label: "Cancelled" },
    };
    return statusConfig[status] || statusConfig.placed;
  };

  const cancelOrder = async (id) => {
    try {
      await orderService.cancelMyOrder(token, id);
      setMessage("Order cancelled successfully");
      await loadOrders();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to cancel this order");
    }
  };

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <div className="mb-4 space-y-1">
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold md:text-3xl" style={{ color: palette.text }}>
            <FiClipboard className="h-6 w-6" />
            Order History
          </h1>
          <p className="text-sm md:text-base" style={{ color: palette.muted }}>
            Track the status of your orders from placement to completion.
          </p>
        </div>

        {message ? (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: message.includes("successfully") ? "#16a34a" : "#dc2626",
              backgroundColor: message.includes("successfully")
                ? (resolvedMode === "dark" ? "#052e16" : "#dcfce7")
                : (resolvedMode === "dark" ? "#450a0a" : "#fee2e2"),
              color: message.includes("successfully")
                ? (resolvedMode === "dark" ? "#86efac" : "#166534")
                : (resolvedMode === "dark" ? "#fca5a5" : "#991b1b"),
            }}
          >
            {message}
          </div>
        ) : null}

        <div className="space-y-3">
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
                <article
                  key={order._id}
                  className="card-elevated space-y-3 p-4 md:p-5"
                  style={{
                    backgroundColor: palette.panelBg,
                    border: `1px solid ${palette.border}`,
                    boxShadow: resolvedMode === "dark" ? "0 16px 40px rgba(0, 0, 0, 0.28)" : "0 16px 32px rgba(15, 23, 42, 0.07)",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <h2 className="text-base font-semibold md:text-lg" style={{ color: palette.text }}>
                          {order.orderNumber}
                        </h2>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                        >
                          {statusBadge.label || order.status}
                        </span>
                      </div>
                      <p className="inline-flex items-center gap-1.5 text-xs md:text-sm" style={{ color: palette.muted }}>
                        <FiClock className="h-3.5 w-3.5" />
                        {orderDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold md:text-base" style={{ color: "#10b981" }}>
                        Rs {Number(order.grandTotal || 0).toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-[11px] md:text-xs" style={{ color: palette.muted }}>
                        {order.serviceType === "online" ? "Online Order" : `Table ${order.tableNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: palette.border }}>
                    <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: palette.text }}>
                      <FiGrid className="h-3.5 w-3.5" />
                      Items Ordered
                    </h3>
                    <div className="space-y-1.5">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                          style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}
                        >
                          <div>
                            <p className="text-sm font-semibold" style={{ color: palette.text }}>
                              {item.name}
                            </p>
                            <p className="text-[11px]" style={{ color: palette.muted }}>
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold" style={{ color: "#10b981" }}>
                            Rs {Number(item.unitPrice * item.quantity || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2 md:text-sm">
                    <div className="rounded-lg border px-3 py-2.5" style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: palette.muted }}>
                        Customer
                      </p>
                      <p className="inline-flex items-center gap-1.5 font-semibold" style={{ color: palette.text }}>
                        <FiUser className="h-3.5 w-3.5" />
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px]" style={{ color: palette.muted }}>
                        <FiPhone className="h-3 w-3" />
                        {order.customerPhone || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-lg border px-3 py-2.5" style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: palette.muted }}>
                        Contact
                      </p>
                      <p className="inline-flex items-center gap-1.5 break-all text-[11px] md:text-xs" style={{ color: palette.text }}>
                        <FiMail className="h-3 w-3" />
                        {order.customerEmail || "N/A"}
                      </p>
                    </div>
                  </div>

                  {order.notes && (
                    <div
                      className="rounded-lg border-l-4 px-3 py-2.5"
                      style={{ borderColor: "#0b6b49", backgroundColor: palette.cardBg }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: palette.muted }}>
                        Special Requests
                      </p>
                      <p className="mt-1 text-xs md:text-sm" style={{ color: palette.text }}>
                        {order.notes}
                      </p>
                    </div>
                  )}

                  {order.serviceType === "online" && order.deliveryAddress ? (
                    <div
                      className="rounded-lg border-l-4 px-3 py-2.5"
                      style={{ borderColor: "#1d4ed8", backgroundColor: palette.cardBg }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: palette.muted }}>
                        Delivery Address
                      </p>
                      <p className="mt-1 text-xs md:text-sm" style={{ color: palette.text }}>
                        {order.deliveryAddress}
                      </p>
                    </div>
                  ) : null}

                  {["placed", "received"].includes(order.status) ? (
                    <div className="pt-1">
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Cancel Order
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div
              className="card-elevated space-y-3 p-8 text-center text-sm"
              style={{ backgroundColor: palette.panelBg, border: `1px solid ${palette.border}` }}
            >
              <FiInbox className="mx-auto h-8 w-8" style={{ color: palette.muted }} />
              <p className="text-lg font-semibold" style={{ color: palette.text }}>
                No Orders Yet
              </p>
              <p style={{ color: palette.muted }}>Start ordering from the menu to see your history.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Customer_Orders;

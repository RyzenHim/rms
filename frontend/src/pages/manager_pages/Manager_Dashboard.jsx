import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";
import api from "../../services/api";
import { FiShoppingBag, FiDollarSign, FiUsers, FiClock, FiCheckCircle, FiTrendingUp, FiAlertCircle, FiXCircle } from "react-icons/fi";

const Manager_Dashboard = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, analyticsRes] = await Promise.all([
        orderService.getOrders(token),
        api.get("/analytics?range=week", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }))
      ]);
      setOrders(ordersRes.orders || []);
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const pendingKitchen = orders.filter((x) => ["placed", "received", "preparing"].includes(x.status)).length;
    const readyToServe = orders.filter((x) => x.status === "done_preparing").length;
    const servedToday = orders.filter((x) => x.status === "served").length;
    const cancelledToday = orders.filter((x) => x.status === "cancelled").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders.filter(o => o.status !== "cancelled").reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);

    const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum, x) => sum + Number(x.grandTotal || 0), 0);

    return { pendingKitchen, readyToServe, servedToday, cancelledToday, todayRevenue, totalRevenue };
  }, [orders]);

  const orderStatusBreakdown = useMemo(() => {
    const statusCounts = {
      placed: 0,
      received: 0,
      preparing: 0,
      done_preparing: 0,
      served: 0,
      cancelled: 0
    };
    orders.forEach(o => {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    });
    return statusCounts;
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(token, orderId, status);
      setMessage(`Order moved to ${status}`);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to update order status");
    }
  };

  const formatCurrency = (amount) => `Rs ${(amount || 0).toLocaleString()}`;
  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: FiDollarSign, color: "bg-emerald-500", subtext: `${stats.servedToday} orders served` },
    { label: "Kitchen Pending", value: stats.pendingKitchen, icon: FiClock, color: "bg-amber-500", subtext: "Orders in progress" },
    { label: "Ready to Serve", value: stats.readyToServe, icon: FiShoppingBag, color: "bg-blue-500", subtext: "Awaiting pickup" },
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: FiTrendingUp, color: "bg-purple-500", subtext: `${orders.length} total orders` },
  ];

  const statusConfig = {
    placed: { label: "Placed", color: "bg-slate-100 text-slate-700", icon: FiAlertCircle },
    received: { label: "Received", color: "bg-blue-100 text-blue-700", icon: FiCheckCircle },
    preparing: { label: "Preparing", color: "bg-amber-100 text-amber-700", icon: FiClock },
    done_preparing: { label: "Ready", color: "bg-purple-100 text-purple-700", icon: FiShoppingBag },
    served: { label: "Served", color: "bg-emerald-100 text-emerald-700", icon: FiCheckCircle },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: FiXCircle },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Manager Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Live operations overview, analytics, and quick controls.</p>
        </div>
        <button
          onClick={loadData}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Refresh Data
        </button>
      </div>

      {message && <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">{message}</p>}

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.subtext}</p>
              </div>
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Order Status Overview */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Order Status Overview</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(orderStatusBreakdown).map(([status, count]) => {
            const config = statusConfig[status];
            return (
              <div key={status} className={`rounded-xl border p-4 ${config.color}`}>
                <p className="text-3xl font-black">{count}</p>
                <p className="text-sm font-medium">{config.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Analytics from backend */}
      {analytics && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Trend */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Weekly Revenue</h3>
            <div className="mt-4 h-40">
              {(analytics.salesTrend || []).length > 0 ? (
                <div className="flex h-full items-end gap-1">
                  {analytics.salesTrend.map((day, idx) => {
                    const maxRevenue = Math.max(...(analytics.salesTrend || []).map(d => d.revenue), 1);
                    const height = (day.revenue / maxRevenue) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                          style={{ height: `${height}%`, minHeight: day.revenue > 0 ? "4px" : "0" }}
                          title={`${day.day}: ${formatCurrency(day.revenue)}`}
                        />
                        <p className="mt-2 text-[10px] text-slate-500">{day.day}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-slate-500">No data available</p>
              )}
            </div>
          </section>

          {/* Quick Stats */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Quick Analytics</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Avg Order Value</span>
                <span className="font-bold text-slate-900">
                  {analytics.totalOrders > 0 ? formatCurrency(analytics.totalRevenue / analytics.totalOrders) : "Rs 0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Revenue Growth</span>
                <span className={`font-bold ${analytics.revenueGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {analytics.revenueGrowth >= 0 ? "+" : ""}{analytics.revenueGrowth || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Active Customers</span>
                <span className="font-bold text-slate-900">{analytics.activeCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Customer Rating</span>
                <span className="font-bold text-amber-600">{analytics.averageRating || "N/A"}/5</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Recent Orders with Actions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
        <div className="mt-4 max-h-96 space-y-3 overflow-auto">
          {orders.slice(0, 15).map((order) => {
            const statusInfo = statusConfig[order.status];
            return (
              <div key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{order.orderNumber}</p>
                    <p className="text-sm text-slate-600">
                      Table {order.tableNumber} • {formatTime(order.createdAt)} • {order.customerName || "Guest"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-600">{formatCurrency(order.grandTotal)}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500 line-clamp-1">
                  {order.items?.map((x) => `${x.name} x${x.quantity}`).join(", ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["received", "preparing", "done_preparing", "served", "cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(order._id, status)}
                      disabled={order.status === status}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${order.status === status
                          ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                          : "border-slate-300 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="py-8 text-center">
              <FiShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No orders found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Manager_Dashboard;


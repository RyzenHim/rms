import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { FiShoppingBag, FiUsers, FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock, FiStar, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";

const RoleDashboard = ({ roleLabel }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState("week");

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `Rs ${(amount || 0).toLocaleString()}`;
  const formatPercent = (val) => `${val || 0}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(analytics?.totalRevenue),
      change: analytics?.revenueGrowth,
      icon: FiDollarSign,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
    },
    {
      label: "Total Orders",
      value: analytics?.totalOrders || 0,
      change: null,
      icon: FiShoppingBag,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      label: "Active Customers",
      value: analytics?.activeCustomers || 0,
      change: analytics?.newCustomers ? `+${analytics.newCustomers} new` : null,
      icon: FiUsers,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      label: "Avg Rating",
      value: analytics?.averageRating ? `${analytics.averageRating}/5` : "N/A",
      change: analytics?.totalReviews ? `${analytics.totalReviews} reviews` : null,
      icon: FiStar,
      color: "bg-amber-500",
      textColor: "text-amber-600",
    },
  ];

  const orderStats = [
    { label: "Pending", value: analytics?.pendingOrders || 0, color: "bg-amber-100 text-amber-700", icon: FiClock },
    { label: "Preparing", value: analytics?.preparingOrders || 0, color: "bg-blue-100 text-blue-700", icon: FiTrendingUp },
    { label: "Completed", value: analytics?.completedOrders || 0, color: "bg-emerald-100 text-emerald-700", icon: FiCheckCircle },
    { label: "Cancelled", value: analytics?.cancelledOrders || 0, color: "bg-red-100 text-red-700", icon: FiXCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{roleLabel} Dashboard</h2>
          <p className="mt-1 text-slate-600">Overview of your restaurant performance and metrics.</p>
        </div>
        <div className="flex gap-2">
          {["day", "week", "month", "year"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${range === r
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
                {stat.change && (
                  <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${stat.change > 0 ? "text-emerald-600" : "text-slate-500"}`}>
                    {stat.change > 0 ? <FiTrendingUp className="h-3 w-3" /> : null}
                    {stat.change}
                  </p>
                )}
              </div>
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Order Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Order Status</h3>
          <div className="mt-4 space-y-3">
            {orderStats.map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{stat.label}</span>
                </div>
                <span className="text-xl font-black text-slate-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Customer Insights</h3>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Repeat Customer Rate</span>
                <span className="font-bold text-slate-900">{formatPercent(analytics?.repeatCustomerPercentage)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${analytics?.repeatCustomerPercentage || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Avg Orders/Customer</span>
                <span className="font-bold text-slate-900">{analytics?.avgOrdersPerCustomer || 0}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Satisfaction Score</span>
                <span className="font-bold text-slate-900">{formatPercent(analytics?.satisfactionScore)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${analytics?.satisfactionScore || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Peak Hours</h3>
          <div className="mt-4 flex items-end gap-1">
            {(analytics?.peakHours || []).map((hour, idx) => {
              const maxOrders = Math.max(...(analytics?.peakHours || []).map(h => h.orders), 1);
              const height = (hour.orders / maxOrders) * 100;
              return (
                <div key={idx} className="flex-1">
                  <div
                    className="rounded-t bg-emerald-500 transition-all hover:bg-emerald-600"
                    style={{ height: `${height}%`, minHeight: hour.orders > 0 ? "4px" : "0" }}
                    title={`${hour.time}: ${hour.orders} orders`}
                  />
                  <p className="mt-1 text-center text-[10px] text-slate-500">{hour.time}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Items */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Top Selling Items</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="pb-3">Item</th>
                <th className="pb-3 text-right">Orders</th>
                <th className="pb-3 text-right">Revenue</th>
                <th className="pb-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(analytics?.topItems || []).slice(0, 5).map((item, idx) => (
                <tr key={idx} className="group">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-700">{item.orders}</td>
                  <td className="py-3 text-right font-semibold text-emerald-600">{formatCurrency(item.revenue)}</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <FiStar className="h-4 w-4 fill-current" />
                      {item.rating ? item.rating.toFixed(1) : "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!analytics?.topItems || analytics.topItems.length === 0) && (
            <p className="py-8 text-center text-sm text-slate-500">No sales data available for this period.</p>
          )}
        </div>
      </div>

      {/* Sales Trend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
        <div className="mt-4 h-48">
          {(analytics?.salesTrend || []).length > 0 ? (
            <div className="flex h-full items-end gap-2">
              {analytics.salesTrend.map((day, idx) => {
                const maxRevenue = Math.max(...analytics.salesTrend.map(d => d.revenue), 1);
                const height = (day.revenue / maxRevenue) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                      style={{ height: `${height}%`, minHeight: day.revenue > 0 ? "4px" : "0" }}
                      title={`${day.day}: ${formatCurrency(day.revenue)}`}
                    />
                    <p className="mt-2 text-[10px] text-slate-500">{day.day}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">No trend data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleDashboard;


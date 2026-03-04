import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api, { withAuth } from "../../services/api";

const toInputDate = (value) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const AdminAnalytics = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("week");
  const [customDay, setCustomDay] = useState(toInputDate(Date.now()));
  const [startDate, setStartDate] = useState(toInputDate(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(toInputDate(Date.now()));

  useEffect(() => {
    if (!token) return;
    if (timeRange === "custom_day" && !customDay) return;
    if (timeRange === "custom_range" && (!startDate || !endDate)) return;
    loadAnalytics();
  }, [timeRange, token, customDay, startDate, endDate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (timeRange === "custom_day") {
        params.set("date", customDay);
      } else if (timeRange === "custom_range") {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      } else {
        params.set("range", timeRange);
      }
      const { data } = await api.get(`/analytics?${params.toString()}`, withAuth(token));
      setAnalytics(data);
    } catch (err) {
      setAnalytics(null);
      setError(err?.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const avgOrderValue = useMemo(() => {
    const totalRevenue = Number(analytics?.totalRevenue || 0);
    const totalOrders = Number(analytics?.totalOrders || 0);
    if (!totalOrders) return 0;
    return Math.round(totalRevenue / totalOrders);
  }, [analytics]);

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading analytics...</div>;
  }

  if (error) {
    return <div className="rounded-lg bg-red-100 text-red-800 p-4">{error}</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-slate-600">No analytics available</div>;
  }

  const maxTrendRevenue = Math.max(1, ...(analytics.salesTrend || []).map((d) => Number(d.revenue || 0)));
  const maxPeakOrders = Math.max(1, ...(analytics.peakHours || []).map((h) => Number(h.orders || 0)));
  const safeTotalOrders = Math.max(1, Number(analytics.totalOrders || 0));

  return (
    <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold"> Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input-base px-3 sm:px-4 py-2 text-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom_day">Custom Day</option>
          <option value="custom_range">Date Range</option>
        </select>
        {timeRange === "custom_day" ? (
          <input
            type="date"
            value={customDay}
            onChange={(e) => setCustomDay(e.target.value)}
            className="input-base px-3 sm:px-4 py-2 text-sm"
          />
        ) : null}
        {timeRange === "custom_range" ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base px-3 sm:px-4 py-2 text-sm"
            />
            <span className="text-slate-500 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base px-3 sm:px-4 py-2 text-sm"
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Total Revenue</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">Rs {Number(analytics.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2">{analytics.revenueGrowth >= 0 ? "Up" : "Down"} {Math.abs(Number(analytics.revenueGrowth || 0))}%</p>
        </div>

        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Total Orders</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">{Number(analytics.totalOrders || 0)}</p>
          <p className="text-xs text-blue-600 mt-2">Avg: Rs {avgOrderValue.toLocaleString()}</p>
        </div>

        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Active Customers</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">{Number(analytics.activeCustomers || 0)}</p>
          <p className="text-xs text-purple-600 mt-2">+{Number(analytics.newCustomers || 0)}</p>
        </div>

        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Avg Rating</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">{Number(analytics.averageRating || 0).toFixed(1)} star</p>
          <p className="text-xs text-orange-600 mt-2">{Number(analytics.totalReviews || 0)} reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Sales Trend</h3>
          <div className="h-48 sm:h-64 flex items-end justify-around bg-slate-50 rounded-lg p-3 sm:p-4 gap-2">
            {(analytics.salesTrend || []).map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 sm:w-8 bg-orange-500 rounded transition-all hover:bg-orange-600"
                  style={{
                    height: `${(Number(day.revenue || 0) / maxTrendRevenue) * 200}px`,
                  }}
                  title={`Rs ${Number(day.revenue || 0).toLocaleString()}`}
                />
                <p className="text-xs">{day.day}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Order Status</h3>
          <div className="space-y-3">
            {[
              { status: "Completed", count: Number(analytics.completedOrders || 0), color: "bg-green-500" },
              { status: "Preparing", count: Number(analytics.preparingOrders || 0), color: "bg-blue-500" },
              { status: "Pending", count: Number(analytics.pendingOrders || 0), color: "bg-yellow-500" },
              { status: "Cancelled", count: Number(analytics.cancelledOrders || 0), color: "bg-red-500" },
            ].map((item) => (
              <div key={item.status}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-sm text-slate-600">{item.count}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color}`}
                    style={{
                      width: `${(item.count / safeTotalOrders) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-elevated p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4"> Top 10 Popular Items</h3>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Item</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Orders</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Revenue</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Rating</th>
              </tr>
            </thead>
            <tbody>
              {(analytics.topItems || []).map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 sm:px-4 py-3">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      {Number(item.orders || 0)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-medium text-sm">Rs {Number(item.revenue || 0).toLocaleString()}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm">{Number(item.rating || 0).toFixed(1)} star</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden grid grid-cols-1 gap-3 sm:gap-4">
          {(analytics.topItems || []).map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-3 sm:p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-slate-900 flex-1">{item.name}</p>
                <span className="text-sm font-bold text-orange-600">{Number(item.rating || 0).toFixed(1)} star</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-slate-600">Orders</p>
                  <p className="font-bold">{Number(item.orders || 0)}</p>
                </div>
                <div>
                  <p className="text-slate-600">Revenue</p>
                  <p className="font-bold">Rs {Number(item.revenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4"> Customer Insights</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Repeat Customers</p>
              <p className="text-xl sm:text-2xl font-bold">{Number(analytics.repeatCustomerPercentage || 0)}%</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Avg Orders per Customer</p>
              <p className="text-xl sm:text-2xl font-bold">{Number(analytics.avgOrdersPerCustomer || 0).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Customer Satisfaction</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${Number(analytics.satisfactionScore || 0)}%` }} />
                </div>
                <span className="text-xs sm:text-sm font-medium min-w-12">{Number(analytics.satisfactionScore || 0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Peak Hours</h3>
          <div className="space-y-2 sm:space-y-3">
            {(analytics.peakHours || []).map((hour) => (
              <div key={hour.time}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium">{hour.time}</span>
                  <span className="text-xs sm:text-sm text-slate-600">{Number(hour.orders || 0)} orders</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${(Number(hour.orders || 0) / maxPeakOrders) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

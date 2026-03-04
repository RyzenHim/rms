import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const AdminAnalytics = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week"); // week, month, year

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <div className="text-center py-12 text-slate-600">Loading analytics...</div>;
  }

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
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Total Revenue</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2">↑ {analytics.revenueGrowth}%</p>
        </div>

        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Total Orders</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">{analytics.totalOrders}</p>
          <p className="text-xs text-blue-600 mt-2">Avg: ₹{(analytics.totalRevenue / analytics.totalOrders).toFixed(0)}</p>
        </div>

        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Active Customers</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">{analytics.activeCustomers}</p>
          <p className="text-xs text-purple-600 mt-2">+{analytics.newCustomers}</p>
        </div>

        <div className="card-elevated p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-slate-600 mb-2">Avg Rating</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold">{analytics.averageRating} ⭐</p>
          <p className="text-xs text-orange-600 mt-2">{analytics.totalReviews} reviews</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Trend Chart */}
        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Sales Trend</h3>
          <div className="h-48 sm:h-64 flex items-end justify-around bg-slate-50 rounded-lg p-3 sm:p-4 gap-2">
            {analytics.salesTrend?.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 sm:w-8 bg-orange-500 rounded transition-all hover:bg-orange-600"
                  style={{
                    height: `${(day.revenue / Math.max(...analytics.salesTrend.map((d) => d.revenue))) * 200}px`,
                  }}
                  title={`₹${day.revenue}`}
                />
                <p className="text-xs">{day.day}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Order Status</h3>
          <div className="space-y-3">
            {[
              { status: "Completed", count: analytics.completedOrders, color: "bg-green-500" },
              { status: "Preparing", count: analytics.preparingOrders, color: "bg-blue-500" },
              { status: "Pending", count: analytics.pendingOrders, color: "bg-yellow-500" },
              { status: "Cancelled", count: analytics.cancelledOrders, color: "bg-red-500" },
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
                      width: `${(item.count / analytics.totalOrders) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="card-elevated p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4"> Top 10 Popular Items</h3>
        
        {/* Desktop Table View */}
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
              {analytics.topItems?.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 sm:px-4 py-3">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      {item.orders}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-medium text-sm">₹{item.revenue.toLocaleString()}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm">{item.rating.toFixed(1)} ⭐</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden grid grid-cols-1 gap-3 sm:gap-4">
          {analytics.topItems?.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-3 sm:p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-slate-900 flex-1">{item.name}</p>
                <span className="text-sm font-bold text-orange-600">{item.rating.toFixed(1)} ⭐</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-slate-600">Orders</p>
                  <p className="font-bold">{item.orders}</p>
                </div>
                <div>
                  <p className="text-slate-600">Revenue</p>
                  <p className="font-bold">₹{item.revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4"> Customer Insights</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Repeat Customers</p>
              <p className="text-xl sm:text-2xl font-bold">{analytics.repeatCustomerPercentage}%</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Avg Orders per Customer</p>
              <p className="text-xl sm:text-2xl font-bold">{analytics.avgOrdersPerCustomer.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Customer Satisfaction</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${analytics.satisfactionScore}%` }} />
                </div>
                <span className="text-xs sm:text-sm font-medium min-w-12">{analytics.satisfactionScore}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-elevated p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">⏰ Peak Hours</h3>
          <div className="space-y-2 sm:space-y-3">
            {analytics.peakHours?.map((hour) => (
              <div key={hour.time}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium">{hour.time}</span>
                  <span className="text-xs sm:text-sm text-slate-600">{hour.orders} orders</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${(hour.orders / Math.max(...analytics.peakHours.map((h) => h.orders))) * 100}%`,
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

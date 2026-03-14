import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBarChart2, FiCalendar, FiStar, FiTrendingUp, FiUsers } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import api, { withAuth } from "../../services/api";

const toInputDate = (value) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const rangeCards = [
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

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

    loadAnalytics();
  }, [customDay, endDate, startDate, timeRange, token]);

  const avgOrderValue = useMemo(() => {
    const totalRevenue = Number(analytics?.totalRevenue || 0);
    const totalOrders = Number(analytics?.totalOrders || 0);
    if (!totalOrders) return 0;
    return Math.round(totalRevenue / totalOrders);
  }, [analytics]);

  const maxTrendRevenue = Math.max(1, ...(analytics?.salesTrend || []).map((day) => Number(day.revenue || 0)));
  const maxPeakOrders = Math.max(1, ...(analytics?.peakHours || []).map((hour) => Number(hour.orders || 0)));
  const safeTotalOrders = Math.max(1, Number(analytics?.totalOrders || 0));

  if (loading) {
    return <div className="py-20 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Loading analytics...</div>;
  }

  if (error) {
    return <div className="alert-error">{error}</div>;
  }

  if (!analytics) {
    return <div className="py-20 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">No analytics available.</div>;
  }

  const metrics = [
    {
      label: "Revenue",
      value: `Rs ${Number(analytics.totalRevenue || 0).toLocaleString()}`,
      meta: `${Number(analytics.revenueGrowth || 0) >= 0 ? "+" : ""}${Number(analytics.revenueGrowth || 0)}% growth`,
      icon: FiTrendingUp,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Orders",
      value: Number(analytics.totalOrders || 0),
      meta: `Avg Rs ${avgOrderValue.toLocaleString()}`,
      icon: FiBarChart2,
      gradient: "from-sky-500 to-indigo-500",
    },
    {
      label: "Customers",
      value: Number(analytics.activeCustomers || 0),
      meta: `+${Number(analytics.newCustomers || 0)} new`,
      icon: FiUsers,
      gradient: "from-fuchsia-500 to-violet-500",
    },
    {
      label: "Rating",
      value: `${Number(analytics.averageRating || 0).toFixed(1)} / 5`,
      meta: `${Number(analytics.totalReviews || 0)} reviews`,
      icon: FiStar,
      gradient: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <div className="space-y-6 p-1 sm:p-2">
      <section className="glass-panel animate-rise-in overflow-hidden rounded-[2rem] p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="glass-pill inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              <FiActivity className="h-3.5 w-3.5" />
              Executive Analytics
            </span>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">Analytics Dashboard</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Measure revenue performance, customer behavior, item popularity, and service pressure with a cleaner management view.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] xl:w-[32rem]">
            {rangeCards.map((range, index) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`smooth-transform animate-fade-in-up stagger-${index + 1} rounded-2xl border px-4 py-3 text-left ${
                  timeRange === range.id
                    ? "border-transparent bg-slate-900 text-white shadow-xl dark:bg-sky-400 dark:text-slate-950"
                    : "glass-subtle text-slate-700 dark:text-slate-200"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Quick Range</p>
                <p className="mt-1 text-sm font-semibold">{range.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="glass-subtle flex flex-1 flex-col gap-3 rounded-[1.5rem] p-3 sm:flex-row">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="input-base min-w-[11rem] text-sm">
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom_day">Custom Day</option>
              <option value="custom_range">Date Range</option>
            </select>
            {timeRange === "custom_day" ? (
              <label className="flex flex-1 items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                <FiCalendar className="h-4 w-4" />
                <input type="date" value={customDay} onChange={(e) => setCustomDay(e.target.value)} className="w-full bg-transparent outline-none" />
              </label>
            ) : null}
            {timeRange === "custom_range" ? (
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                  <FiCalendar className="h-4 w-4" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent outline-none" />
                </label>
                <label className="flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                  <FiCalendar className="h-4 w-4" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent outline-none" />
                </label>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className={`card-elevated animate-fade-in-up stagger-${Math.min(index + 1, 4)} smooth-transform p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{metric.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{metric.value}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{metric.meta}</p>
                </div>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${metric.gradient} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card-elevated animate-scale-in p-5 sm:p-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Sales Trend</h3>
          <div className="mt-5 flex h-64 items-end justify-around gap-3 rounded-[1.75rem] bg-white/25 p-4 dark:bg-slate-900/20">
            {(analytics.salesTrend || []).map((day, index) => (
              <div key={`${day.day}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-[1.25rem] bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300 transition-all duration-700"
                  style={{ height: `${(Number(day.revenue || 0) / maxTrendRevenue) * 100}%`, minHeight: day.revenue ? "10px" : "0px" }}
                  title={`Rs ${Number(day.revenue || 0).toLocaleString()}`}
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{day.day}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card-elevated animate-scale-in stagger-1 p-5 sm:p-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Order Status</h3>
          <div className="mt-5 space-y-4">
            {[
              { status: "Completed", count: Number(analytics.completedOrders || 0), gradient: "from-emerald-500 to-teal-400" },
              { status: "Preparing", count: Number(analytics.preparingOrders || 0), gradient: "from-sky-500 to-cyan-400" },
              { status: "Pending", count: Number(analytics.pendingOrders || 0), gradient: "from-yellow-400 to-amber-500" },
              { status: "Cancelled", count: Number(analytics.cancelledOrders || 0), gradient: "from-rose-500 to-red-500" },
            ].map((item) => (
              <div key={item.status} className="glass-subtle rounded-2xl p-4">
                <div className="mb-2 flex justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.status}</span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{item.count}</span>
                </div>
                <div className="metric-bar h-2.5">
                  <span className={`bg-gradient-to-r ${item.gradient}`} style={{ width: `${(item.count / safeTotalOrders) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card-elevated animate-fade-in-up p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Top 10 Popular Items</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The most ordered menu items ranked by popularity, revenue, and guest sentiment.</p>
          </div>
        </div>

        <div className="mt-5 hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {(analytics.topItems || []).map((item, index) => (
                <tr key={`${item.name}-${index}`} className="border-b border-slate-200/40 transition-colors hover:bg-white/30 dark:border-slate-700/40 dark:hover:bg-slate-900/20">
                  <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-50">{item.name}</td>
                  <td className="px-4 py-4">
                    <span className="glass-pill inline-flex rounded-full px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                      {Number(item.orders || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-emerald-600">Rs {Number(item.revenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-4 font-semibold text-amber-500">{Number(item.rating || 0).toFixed(1)} star</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 lg:hidden">
          {(analytics.topItems || []).map((item, index) => (
            <article key={`${item.name}-${index}`} className="glass-subtle rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                <span className="text-sm font-bold text-amber-500">{Number(item.rating || 0).toFixed(1)} star</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Orders</p>
                  <p className="font-bold text-slate-900 dark:text-slate-50">{Number(item.orders || 0)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Revenue</p>
                  <p className="font-bold text-emerald-600">Rs {Number(item.revenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card-elevated animate-fade-in-up stagger-1 p-5 sm:p-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Customer Insights</h3>
          <div className="mt-5 space-y-4">
            <div className="glass-subtle rounded-2xl p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Repeat Customers</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50">{Number(analytics.repeatCustomerPercentage || 0)}%</p>
            </div>
            <div className="glass-subtle rounded-2xl p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average Orders Per Customer</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50">{Number(analytics.avgOrdersPerCustomer || 0).toFixed(1)}</p>
            </div>
            <div className="glass-subtle rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer Satisfaction</p>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{Number(analytics.satisfactionScore || 0)}%</span>
              </div>
              <div className="metric-bar h-2.5">
                <span className="bg-gradient-to-r from-emerald-400 to-sky-500" style={{ width: `${Number(analytics.satisfactionScore || 0)}%` }} />
              </div>
            </div>
          </div>
        </article>

        <article className="card-elevated animate-fade-in-up stagger-2 p-5 sm:p-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Peak Hours</h3>
          <div className="mt-5 space-y-4">
            {(analytics.peakHours || []).map((hour) => (
              <div key={hour.time} className="glass-subtle rounded-2xl p-4">
                <div className="mb-2 flex justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{hour.time}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{Number(hour.orders || 0)} orders</span>
                </div>
                <div className="metric-bar h-2.5">
                  <span className="bg-gradient-to-r from-orange-400 to-rose-500" style={{ width: `${(Number(hour.orders || 0) / maxPeakOrders) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminAnalytics;

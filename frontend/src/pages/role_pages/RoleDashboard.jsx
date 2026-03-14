import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiDollarSign, FiShoppingBag, FiStar, FiTrendingUp, FiUsers, FiXCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const rangeOptions = ["day", "week", "month", "year"];

const RoleDashboard = ({ roleLabel }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState("week");

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [range, token]);

  const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString()}`;
  const formatPercent = (amount) => `${Number(amount || 0)}%`;
  const maxPeakOrders = Math.max(1, ...(analytics?.peakHours || []).map((hour) => Number(hour.orders || 0)));
  const maxRevenue = Math.max(1, ...(analytics?.salesTrend || []).map((day) => Number(day.revenue || 0)));

  const stats = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatCurrency(analytics?.totalRevenue),
        meta: `${Number(analytics?.revenueGrowth || 0) >= 0 ? "+" : ""}${Number(analytics?.revenueGrowth || 0)}% vs previous`,
        icon: FiDollarSign,
        iconClass: "from-emerald-500 to-teal-500",
      },
      {
        label: "Total Orders",
        value: Number(analytics?.totalOrders || 0),
        meta: `${Number(analytics?.pendingOrders || 0)} pending in queue`,
        icon: FiShoppingBag,
        iconClass: "from-sky-500 to-blue-500",
      },
      {
        label: "Active Customers",
        value: Number(analytics?.activeCustomers || 0),
        meta: `+${Number(analytics?.newCustomers || 0)} new customers`,
        icon: FiUsers,
        iconClass: "from-fuchsia-500 to-violet-500",
      },
      {
        label: "Average Rating",
        value: analytics?.averageRating ? `${Number(analytics.averageRating).toFixed(1)}/5` : "N/A",
        meta: `${Number(analytics?.totalReviews || 0)} reviews`,
        icon: FiStar,
        iconClass: "from-amber-400 to-orange-500",
      },
    ],
    [analytics],
  );

  const orderStats = [
    { label: "Pending", value: Number(analytics?.pendingOrders || 0), icon: FiClock, tone: "text-amber-600" },
    { label: "Preparing", value: Number(analytics?.preparingOrders || 0), icon: FiTrendingUp, tone: "text-sky-600" },
    { label: "Completed", value: Number(analytics?.completedOrders || 0), icon: FiCheckCircle, tone: "text-emerald-600" },
    { label: "Cancelled", value: Number(analytics?.cancelledOrders || 0), icon: FiXCircle, tone: "text-rose-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="glass-panel animate-soft-pulse rounded-full p-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="glass-pill inline-flex w-fit items-center rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-700 dark:text-slate-200">
              Operational Overview
            </span>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
                {roleLabel} Dashboard
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Revenue, service pace, customer satisfaction, and peak-hour demand in one polished control surface.
              </p>
            </div>
          </div>
          <div className="glass-subtle flex flex-wrap gap-2 rounded-[1.2rem] p-2">
            {rangeOptions.map((option) => (
              <button
                key={option}
                onClick={() => setRange(option)}
                className={`smooth-transform rounded-xl px-4 py-2 text-sm font-bold capitalize ${
                  range === option ? "bg-slate-900 text-white shadow-lg dark:bg-sky-400 dark:text-slate-950" : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className={`card-elevated animate-fade-in-up smooth-transform stagger-${Math.min(index + 1, 4)} relative overflow-hidden p-5`}
            >
              <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br ${stat.iconClass} opacity-20 blur-2xl`} />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{stat.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{stat.value}</p>
                  <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">{stat.meta}</p>
                </div>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.iconClass} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr_1fr]">
        <article className="card-elevated animate-fade-in-up stagger-1 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Order Status</h3>
            <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white dark:bg-slate-100 dark:text-slate-900">
              Live Queue
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {orderStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-subtle smooth-transform flex items-center justify-between rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/40 ${stat.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stat.label}</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-slate-50">{stat.value}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card-elevated animate-fade-in-up stagger-2 p-5">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Customer Insights</h3>
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">Repeat customer rate</span>
                <span className="font-bold text-slate-900 dark:text-slate-50">{formatPercent(analytics?.repeatCustomerPercentage)}</span>
              </div>
              <div className="metric-bar h-2.5">
                <span className="bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${Number(analytics?.repeatCustomerPercentage || 0)}%` }} />
              </div>
            </div>
            <div className="glass-subtle rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Average orders per customer</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50">{Number(analytics?.avgOrdersPerCustomer || 0)}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">Satisfaction score</span>
                <span className="font-bold text-slate-900 dark:text-slate-50">{formatPercent(analytics?.satisfactionScore)}</span>
              </div>
              <div className="metric-bar h-2.5">
                <span className="bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Number(analytics?.satisfactionScore || 0)}%` }} />
              </div>
            </div>
          </div>
        </article>

        <article className="card-elevated animate-fade-in-up stagger-3 p-5">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Peak Hours</h3>
          <div className="mt-5 flex h-[13rem] items-end gap-2 rounded-[1.5rem] bg-white/30 p-4 dark:bg-slate-900/20">
            {(analytics?.peakHours || []).map((hour, index) => (
              <div key={`${hour.time}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-sky-600 via-cyan-500 to-emerald-400 transition-all duration-700"
                  style={{ height: `${(Number(hour.orders || 0) / maxPeakOrders) * 100}%`, minHeight: hour.orders ? "8px" : "0px" }}
                  title={`${hour.time}: ${hour.orders} orders`}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{hour.time}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="card-elevated animate-scale-in p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Top Selling Items</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Best-performing dishes ranked by orders, revenue, and guest feedback.</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                  <th className="pb-3">Item</th>
                  <th className="pb-3 text-right">Orders</th>
                  <th className="pb-3 text-right">Revenue</th>
                  <th className="pb-3 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {(analytics?.topItems || []).slice(0, 5).map((item, index) => (
                  <tr key={`${item.name}-${index}`} className="smooth-transform">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-white">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-semibold text-slate-700 dark:text-slate-200">{item.orders}</td>
                    <td className="py-4 text-right font-semibold text-emerald-600">{formatCurrency(item.revenue)}</td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                        <FiStar className="h-4 w-4 fill-current" />
                        {item.rating ? item.rating.toFixed(1) : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!analytics?.topItems || analytics.topItems.length === 0) && (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">No sales data available for this period.</p>
            )}
          </div>
        </article>

        <article className="card-elevated animate-scale-in stagger-1 p-5">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Revenue Trend</h3>
          <div className="mt-5 flex h-[21rem] items-end gap-3 rounded-[1.75rem] bg-white/25 p-4 dark:bg-slate-900/20">
            {(analytics?.salesTrend || []).length > 0 ? (
              analytics.salesTrend.map((day, index) => (
                <div key={`${day.day}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className="w-full rounded-t-[1.25rem] bg-gradient-to-t from-sky-700 via-cyan-500 to-emerald-300 transition-all duration-700"
                    style={{ height: `${(Number(day.revenue || 0) / maxRevenue) * 100}%`, minHeight: day.revenue ? "8px" : "0px" }}
                    title={`${day.day}: ${formatCurrency(day.revenue)}`}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{day.day}</span>
                </div>
              ))
            ) : (
              <p className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">No trend data available.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default RoleDashboard;

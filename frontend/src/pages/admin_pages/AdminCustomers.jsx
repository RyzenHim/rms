import { useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiEye,
  FiRefreshCcw,
  FiSearch,
  FiSlash,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import customerService from "../../services/customer_Service";

const emptyForm = {
  name: "",
  phone: "",
  loyaltyPoints: 0,
  isActive: true,
  isBlocked: false,
};

const statusTabs = [
  { id: "all", label: "All Customers" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "deleted", label: "Deleted" },
];

const AdminCustomers = () => {
  const { token, user, getPrimaryRole } = useAuth();
  const actorRole = getPrimaryRole(user?.roles || []);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showDeletedSection, setShowDeletedSection] = useState(true);
  useBodyScrollLock(showDetailModal || Boolean(editingCustomer));

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const [customerRes, statsRes] = await Promise.all([
        customerService.getCustomers(token, { page: 1, limit: 200 }),
        customerService.getCustomerStats(token),
      ]);
      setCustomers(customerRes.customers || []);
      setStats(statsRes.stats || null);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to load customers" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const haystack = `${customer.name || ""} ${customer.email || ""} ${customer.phone || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? customer.isActive && !customer.isDeleted
            : statusFilter === "inactive"
              ? !customer.isActive && !customer.isDeleted
              : customer.isDeleted;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const visibleCustomers = filteredCustomers.filter((customer) => !customer.isDeleted);
  const deletedCustomers = customers.filter((customer) => customer.isDeleted);

  const openEditModal = (customer) => {
    if (customer.isDeleted) return;
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      loyaltyPoints: customer.loyaltyPoints || 0,
      isActive: customer.isActive ?? true,
      isBlocked: customer.isBlocked ?? false,
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    try {
      await customerService.updateCustomer(token, editingCustomer.id, form);
      setMessage({ type: "success", text: "Customer updated successfully" });
      setEditingCustomer(null);
      setForm(emptyForm);
      await loadCustomers();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to update customer" });
    }
  };

  const handleToggleStatus = async (customer, nextActive) => {
    if (customer.isDeleted) return;
    try {
      await customerService.toggleCustomerStatus(token, customer.id, nextActive);
      setMessage({ type: "success", text: nextActive ? "Customer activated" : "Customer deactivated" });
      await loadCustomers();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to update status" });
    }
  };

  const handleDelete = async (customer) => {
    try {
      await customerService.deleteCustomer(token, customer.id);
      setMessage({ type: "success", text: "Customer moved to deleted records" });
      if (editingCustomer?.id === customer.id) {
        setEditingCustomer(null);
        setForm(emptyForm);
      }
      await loadCustomers();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete customer" });
    }
  };

  const handleRestore = async (customer) => {
    try {
      await customerService.restoreCustomer(token, customer.id);
      setMessage({ type: "success", text: "Customer restored successfully" });
      await loadCustomers();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to restore customer" });
    }
  };

  const viewCustomerDetails = async (customer) => {
    try {
      const res = await customerService.getCustomerById(token, customer.id);
      setSelectedCustomer(res.customer);
      setCustomerOrders(res.orders || []);
      setShowDetailModal(true);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to load customer details" });
    }
  };

  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");
  const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(2)}`;

  const summary = [
    { label: "Total Customers", value: stats?.totalCustomers ?? customers.filter((entry) => !entry.isDeleted).length, icon: FiUsers, tone: "from-sky-500 to-cyan-400" },
    { label: "Active", value: stats?.activeCustomers ?? customers.filter((entry) => entry.isActive && !entry.isDeleted).length, icon: FiStar, tone: "from-emerald-500 to-teal-400" },
    { label: "Inactive", value: stats?.inactiveCustomers ?? customers.filter((entry) => !entry.isActive && !entry.isDeleted).length, icon: FiSlash, tone: "from-amber-500 to-orange-400" },
    { label: "Deleted", value: stats?.deletedCustomers ?? deletedCustomers.length, icon: FiArchive, tone: "from-rose-500 to-pink-400" },
  ];

  return (
    <div className="space-y-5">
      <section className="glass-panel animate-rise-in rounded-[1.75rem] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="glass-pill inline-flex rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Customer Studio
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
              Customer Management
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review customer accounts, adjust loyalty data, deactivate accounts, and keep deleted records recoverable from one aligned workspace.
            </p>
          </div>
          <div className="glass-subtle rounded-[1.25rem] px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Signed in as <span className="font-black uppercase tracking-[0.14em] text-slate-900 dark:text-slate-50">{actorRole}</span>
          </div>
        </div>
        {message.text ? <div className={`mt-4 ${message.type === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div> : null}
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        {summary.map((card, index) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} smooth-transform p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">{card.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">{card.value}</p>
                </div>
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card-elevated animate-fade-in-up p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Directory</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Search by name, email, or phone and switch quickly between active, inactive, and deleted accounts.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="input-base pl-11" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${statusFilter === tab.id ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "glass-pill text-slate-700 dark:text-slate-200"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Loading customers...</p>
        ) : (
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {visibleCustomers.map((customer, index) => (
              <article key={customer.id} className={`glass-subtle animate-fade-in-up stagger-${(index % 4) + 1} rounded-[1.35rem] p-4 smooth-transform`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-slate-50">{customer.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{customer.email || "No email"}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      joined {formatDate(customer.createdAt)} | {customer.phone || "no phone"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${customer.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                      {customer.isActive ? "Active" : "Inactive"}
                    </span>
                    {customer.isBlocked ? (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                        Blocked
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/55 px-3 py-2 text-center dark:bg-white/5">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-50">{customer.totalOrders || 0}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Orders</p>
                  </div>
                  <div className="rounded-2xl bg-white/55 px-3 py-2 text-center dark:bg-white/5">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Spend</p>
                  </div>
                  <div className="rounded-2xl bg-white/55 px-3 py-2 text-center dark:bg-white/5">
                    <p className="text-sm font-black text-amber-600 dark:text-amber-300">{customer.loyaltyPoints || 0}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Points</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => viewCustomerDetails(customer)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                    View
                  </button>
                  <button onClick={() => openEditModal(customer)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Edit
                  </button>
                  <button onClick={() => handleToggleStatus(customer, !customer.isActive)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                    {customer.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDelete(customer)} className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                    Soft delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !visibleCustomers.length && statusFilter !== "deleted" ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No customers match the current filter.</p>
        ) : null}

        <div className="mt-6 rounded-[1.5rem] border border-white/40 bg-white/40 p-4 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-50">Deleted customers</h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Archived customer accounts stay recoverable here.
              </p>
            </div>
            <button type="button" onClick={() => setShowDeletedSection((value) => !value)} className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <FiEye className="h-3.5 w-3.5" />
              {showDeletedSection ? "Hide section" : "Show section"}
            </button>
          </div>

          {showDeletedSection ? (
            <div className="mt-4 grid gap-3">
              {deletedCustomers.map((customer) => (
                <article key={customer.id} className="glass-subtle rounded-[1.15rem] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-50">{customer.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{customer.email || "No email"}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {customer.phone || "no phone"} | last order {formatDate(customer.lastOrderDate)}
                      </p>
                    </div>
                    <button onClick={() => handleRestore(customer)} className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <FiRefreshCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  </div>
                </article>
              ))}
              {!deletedCustomers.length ? (
                <p className="py-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No deleted customers.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {showDetailModal && selectedCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/28">
          <div className="glass-panel w-full max-w-5xl rounded-[1.8rem] p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">{selectedCustomer.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedCustomer.email || "No email"}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="glass-pill rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="glass-subtle rounded-[1.4rem] p-4">
                <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Profile</h4>
                <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p>Name: <span className="font-semibold">{selectedCustomer.name}</span></p>
                  <p>Email: <span className="font-semibold">{selectedCustomer.email || "N/A"}</span></p>
                  <p>Phone: <span className="font-semibold">{selectedCustomer.phone || "N/A"}</span></p>
                  <p>Member since: <span className="font-semibold">{formatDate(selectedCustomer.createdAt)}</span></p>
                  <p>Last order: <span className="font-semibold">{formatDate(selectedCustomer.lastOrderDate)}</span></p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/60 p-3 text-center dark:bg-white/5">
                    <p className="text-lg font-black text-slate-900 dark:text-slate-50">{selectedCustomer.totalOrders || 0}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Orders</p>
                  </div>
                  <div className="rounded-2xl bg-white/60 p-3 text-center dark:bg-white/5">
                    <p className="text-lg font-black text-amber-600 dark:text-amber-300">{selectedCustomer.loyaltyPoints || 0}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Points</p>
                  </div>
                </div>
              </section>

              <section className="glass-subtle rounded-[1.4rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Recent Orders</h4>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{customerOrders.length} records</span>
                </div>

                <div className="mt-4 max-h-[24rem] space-y-3 overflow-auto pr-1">
                  {customerOrders.length === 0 ? (
                    <p className="py-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No orders found.</p>
                  ) : (
                    customerOrders.map((order) => (
                      <article key={order._id} className="rounded-[1.1rem] border border-white/30 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-mono text-sm font-black text-slate-900 dark:text-slate-50">{order.orderNumber}</p>
                          <span className="rounded-full bg-slate-900/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:bg-white/10 dark:text-slate-200">
                            {order.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Table {order.tableNumber || "N/A"} | {formatDate(order.createdAt)} | {order.items?.length || 0} items
                        </p>
                        <p className="mt-2 text-sm font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(order.grandTotal)}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {editingCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/28">
          <div className="glass-panel w-full max-w-lg rounded-[1.7rem] p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Edit Customer</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Adjust contact details, points, and current account state.</p>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="glass-pill rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                Close
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Customer name" className="input-base" />
              <input type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone number" className="input-base" />
              <input type="number" value={form.loyaltyPoints} onChange={(e) => setForm((prev) => ({ ...prev, loyaltyPoints: Number(e.target.value) }))} placeholder="Loyalty points" className="input-base" />

              <div className="flex flex-wrap gap-5 rounded-[1.15rem] border border-white/30 bg-white/40 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked, isBlocked: !e.target.checked }))} />
                  Active
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <input type="checkbox" checked={form.isBlocked} onChange={(e) => setForm((prev) => ({ ...prev, isBlocked: e.target.checked, isActive: !e.target.checked }))} />
                  Blocked
                </label>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 px-5 py-2.5 text-sm">Save changes</button>
                <button type="button" onClick={() => setEditingCustomer(null)} className="btn-outline flex-1 px-5 py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminCustomers;

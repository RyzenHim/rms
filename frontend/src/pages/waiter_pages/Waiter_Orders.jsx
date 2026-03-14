import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiCoffee, FiSend } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import menuService from "../../services/menu_Service";
import orderService from "../../services/order_Service";

const getStatusConfig = (status) => {
  const configs = {
    placed: { badge: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100", label: "Placed" },
    received: { badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", label: "Received" },
    preparing: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", label: "Preparing" },
    done_preparing: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", label: "Ready" },
    served: { badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300", label: "Served" },
    cancelled: { badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", label: "Cancelled" },
  };
  return configs[status] || configs.placed;
};

const getNextStatus = (currentStatus) => {
  const flow = { placed: "received", received: "preparing", preparing: "done_preparing", done_preparing: "served" };
  return flow[currentStatus];
};

const getStatusLabel = (status) => {
  const labels = { placed: "Mark Received", received: "Start Preparing", preparing: "Mark Ready", done_preparing: "Mark Served" };
  return labels[status] || "Update Status";
};

const initialForm = {
  tableNumber: "",
  customerName: "",
  customerPhone: "",
  notes: "",
  menuItem: "",
  quantity: 1,
  itemNote: "",
};

const Waiter_Orders = () => {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [draftItems, setDraftItems] = useState([]);

  const itemMap = useMemo(() => {
    const map = new Map();
    menuItems.forEach((item) => map.set(item._id, item));
    return map;
  }, [menuItems]);
  const availableTables = useMemo(() => tables.filter((table) => table.isActive && table.status !== "maintenance" && table.status !== "occupied"), [tables]);
  const activeOrders = useMemo(() => orders.filter((order) => ["placed", "received", "preparing", "done_preparing"].includes(order.status)), [orders]);
  const servedOrders = useMemo(() => orders.filter((order) => order.status === "served"), [orders]);
  const stats = useMemo(
    () => ({
      pending: orders.filter((order) => ["placed", "received"].includes(order.status)).length,
      preparing: orders.filter((order) => order.status === "preparing").length,
      ready: orders.filter((order) => order.status === "done_preparing").length,
      served: orders.filter((order) => order.status === "served").length,
    }),
    [orders],
  );

  const loadData = async () => {
    try {
      const [menuRes, ordersRes, tablesRes] = await Promise.all([
        menuService.getPublicMenu(),
        orderService.getOrders(token),
        api.get("/tables").catch(() => ({ data: { tables: [] } })),
      ]);
      setMenuItems(menuRes.items || []);
      setOrders(ordersRes.orders || []);
      setTables(tablesRes.data?.tables || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addDraftItem = () => {
    if (!form.menuItem) {
      setMessage("Please select a menu item");
      return;
    }
    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      setMessage("Quantity must be at least 1");
      return;
    }
    setDraftItems((prev) => [...prev, { menuItem: form.menuItem, quantity: Math.floor(quantity), notes: form.itemNote || "" }]);
    setForm((prev) => ({ ...prev, menuItem: "", quantity: 1, itemNote: "" }));
    setMessage("");
  };

  const removeDraftItem = (index) => setDraftItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

  const createOrder = async (event) => {
    event.preventDefault();
    setMessage("");
    setSuccess("");
    if (!form.tableNumber) {
      setMessage("Please select a table");
      return;
    }
    if (!draftItems.length) {
      setMessage("Please add at least one item");
      return;
    }
    setLoading(true);
    try {
      await orderService.createOrder(token, {
        tableNumber: form.tableNumber,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        notes: form.notes,
        serviceType: "dine_in",
        items: draftItems,
      });
      setSuccess("Order sent to kitchen");
      setForm(initialForm);
      setDraftItems([]);
      await loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Order creation failed");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    setMessage("");
    try {
      await orderService.updateOrderStatus(token, orderId, status);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Status update failed");
    }
  };

  const formatTime = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Floor Operations
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Waiter Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Create table orders fast and track kitchen progress from a cleaner service console.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="glass-pill rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200">{stats.pending} Pending</span>
            <span className="glass-pill rounded-full px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">{stats.preparing} Preparing</span>
            <span className="glass-pill rounded-full px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">{stats.ready} Ready</span>
            <span className="glass-pill rounded-full px-4 py-2 text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">{stats.served} Served</span>
          </div>
        </div>
      </section>

      {message ? <div className="alert-error">{message}</div> : null}
      {success ? <div className="alert-success">{success}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <form onSubmit={createOrder} className="card-elevated animate-fade-in-up p-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg">
              <FiCoffee className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">New Order</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Capture a table order and send it to the kitchen queue.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <select value={form.tableNumber} onChange={(e) => setForm((prev) => ({ ...prev, tableNumber: e.target.value }))} className="input-base" required>
              <option value="">Select Table</option>
              {availableTables.map((table) => <option key={table._id} value={table.tableNumber}>Table {table.tableNumber} ({table.location} • {table.capacity} seats)</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))} className="input-base" />
              <input type="tel" placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))} className="input-base" />
            </div>
            <textarea placeholder="Order notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={2} className="input-base min-h-[5rem]" />
            <div className="glass-subtle rounded-[1.4rem] p-4">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Add Items</p>
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <select value={form.menuItem} onChange={(e) => setForm((prev) => ({ ...prev, menuItem: e.target.value }))} className="input-base flex-1 text-sm">
                    <option value="">Select Item</option>
                    {menuItems.slice(0, 10).map((item) => <option key={item._id} value={item._id}>{item.name?.substring(0, 25)} - Rs {Number(item.price || 0).toFixed(0)}</option>)}
                  </select>
                  <input type="number" min="1" max="20" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} className="input-base w-20 text-center text-sm" />
                  <button type="button" onClick={addDraftItem} className="btn-primary px-4 py-3">Add</button>
                </div>
                <input type="text" placeholder="Item note (optional)" value={form.itemNote} onChange={(e) => setForm((prev) => ({ ...prev, itemNote: e.target.value }))} className="input-base" />
                {draftItems.length ? (
                  <div className="space-y-2">
                    {draftItems.map((item, index) => (
                      <div key={`${item.menuItem}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/40 px-3 py-2 dark:bg-slate-900/20">
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          <span className="font-semibold">{itemMap.get(item.menuItem)?.name || "Item"}</span> x{item.quantity}
                        </p>
                        <button type="button" onClick={() => removeDraftItem(index)} className="text-xs font-bold text-rose-600 dark:text-rose-300">Remove</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <button type="submit" disabled={loading || !draftItems.length} className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-50">
              <FiSend className="h-4 w-4" />
              {loading ? "Sending..." : "Send to Kitchen"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <section className="card-elevated animate-fade-in-up stagger-1 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">Kitchen Orders</h2>
              <span className="glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">{activeOrders.length} active</span>
            </div>
            <div className="mt-4 max-h-[38rem] space-y-3 overflow-auto pr-1">
              {activeOrders.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300/70 px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700/70 dark:text-slate-400">No active orders</div>
              ) : (
                activeOrders.map((order, index) => {
                  const config = getStatusConfig(order.status);
                  const next = getNextStatus(order.status);
                  return (
                    <article key={order._id} className={`glass-subtle animate-fade-in-up stagger-${(index % 4) + 1} rounded-[1.4rem] p-4 smooth-transform`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-50">{order.orderNumber}</span>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${config.badge}`}>{config.label}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Table {order.tableNumber} • {formatTime(order.createdAt)}</p>
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Total: Rs {Number(order.grandTotal || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      {next ? (
                        <button onClick={() => updateStatus(order._id, next)} className="btn-primary mt-4 w-full">
                          {getStatusLabel(order.status)}
                        </button>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {servedOrders.length ? (
            <section className="card-elevated animate-fade-in-up stagger-2 p-5">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-50">Recently Served</h2>
              </div>
              <div className="mt-4 space-y-2">
                {servedOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="glass-subtle flex items-center justify-between rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{order.orderNumber}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Table {order.tableNumber}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                      <FiClock className="h-3.5 w-3.5" />
                      {formatTime(order.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Waiter_Orders;

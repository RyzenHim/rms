import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import menuService from "../../services/menu_Service";
import orderService from "../../services/order_Service";
import api from "../../services/api";

const getStatusConfig = (status) => {
  const configs = {
    placed: { bg: "bg-slate-100", text: "text-slate-700", label: "Placed" },
    received: { bg: "bg-blue-100", text: "text-blue-700", label: "Received" },
    preparing: { bg: "bg-amber-100", text: "text-amber-700", label: "Preparing" },
    done_preparing: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Ready" },
    served: { bg: "bg-purple-100", text: "text-purple-700", label: "Served" },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
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

const Waiter_Orders = () => {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ tableNumber: "", customerName: "", customerPhone: "", notes: "", menuItem: "", quantity: 1, itemNote: "" });
  const [draftItems, setDraftItems] = useState([]);

  const itemMap = useMemo(() => { const map = new Map(); menuItems.forEach(item => map.set(item._id, item)); return map; }, [menuItems]);
  const availableTables = useMemo(() => tables.filter(t => t.isActive && t.status !== "maintenance" && t.status !== "occupied"), [tables]);
  const activeOrders = useMemo(() => orders.filter(o => ["placed", "received", "preparing", "done_preparing"].includes(o.status)), [orders]);
  const servedOrders = useMemo(() => orders.filter(o => o.status === "served"), [orders]);

  const stats = useMemo(() => ({
    pending: orders.filter(o => ["placed", "received"].includes(o.status)).length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "done_preparing").length,
    served: orders.filter(o => o.status === "served").length
  }), [orders]);

  const loadData = async () => {
    try {
      const [menuRes, ordersRes, tablesRes] = await Promise.all([
        menuService.getPublicMenu(),
        orderService.getOrders(token),
        api.get("/tables").catch(() => ({ data: { tables: [] } }))
      ]);
      setMenuItems(menuRes.items || []);
      setOrders(ordersRes.orders || []);
      setTables(tablesRes.data?.tables || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => { loadData(); const timer = setInterval(loadData, 10000); return () => clearInterval(timer); }, []);

  const addDraftItem = () => {
    if (!form.menuItem) { setMessage("Please select a menu item"); return; }
    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty < 1) { setMessage("Quantity must be at least 1"); return; }
    setDraftItems(prev => [...prev, { menuItem: form.menuItem, quantity: Math.floor(qty), notes: form.itemNote || "" }]);
    setForm(prev => ({ ...prev, menuItem: "", quantity: 1, itemNote: "" }));
    setMessage("");
  };

  const removeDraftItem = (idx) => setDraftItems(prev => prev.filter((_, i) => i !== idx));

  const createOrder = async (e) => {
    e.preventDefault();
    setMessage(""); setSuccess("");
    if (!form.tableNumber) { setMessage("Please select a table"); return; }
    if (!draftItems.length) { setMessage("Please add at least one item"); return; }
    setLoading(true);
    try {
      await orderService.createOrder(token, { tableNumber: form.tableNumber, customerName: form.customerName, customerPhone: form.customerPhone, notes: form.notes, serviceType: "dine_in", items: draftItems });
      setSuccess("Order sent to kitchen!");
      setForm({ tableNumber: "", customerName: "", customerPhone: "", notes: "", menuItem: "", quantity: 1, itemNote: "" });
      setDraftItems([]);
      await loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setMessage(err?.response?.data?.message || "Order creation failed"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, status) => { setMessage(""); try { await orderService.updateOrderStatus(token, orderId, status); await loadData(); } catch (err) { setMessage(err?.response?.data?.message || "Status update failed"); } };
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Waiter Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-600">Manage table orders and track kitchen status</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">{stats.pending} Pending</span>
            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800">{stats.preparing} Preparing</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{stats.ready} Ready</span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">{stats.served} Served</span>
          </div>
        </div>

        {message && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{message}</div>}
        {success && <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

        <div className="grid gap-4 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
          <form onSubmit={createOrder} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><span className="text-lg">📝</span> New Order</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Table *</label>
                <select value={form.tableNumber} onChange={e => setForm(p => ({ ...p, tableNumber: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
                  <option value="">Select Table</option>
                  {availableTables.map(t => <option key={t._id} value={t.tableNumber}>Table {t.tableNumber} ({t.location} • {t.capacity} seats)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="mb-1 block text-xs font-medium text-slate-700">Customer Name</label><input type="text" placeholder="Optional" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-700">Phone</label><input type="tel" placeholder="Optional" value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="mb-1 block text-xs font-medium text-slate-700">Order Notes</label><textarea placeholder="Special instructions..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-800">Add Items</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select value={form.menuItem} onChange={e => setForm(p => ({ ...p, menuItem: e.target.value }))} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                      <option value="">Select Item</option>
                      {menuItems.slice(0, 10).map(item => <option key={item._id} value={item._id}>{item.name?.substring(0, 25)} - ₹{Number(item.price || 0).toFixed(0)}</option>)}
                    </select>
                    <input type="number" min="1" max="20" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="w-14 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs" />
                    <button type="button" onClick={addDraftItem} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Add</button>
                  </div>
                  <input type="text" placeholder="Item note (optional)" value={form.itemNote} onChange={e => setForm(p => ({ ...p, itemNote: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                </div>
                {draftItems.length > 0 && <div className="mt-3 space-y-1.5">{draftItems.map((item, idx) => <div key={`${item.menuItem}-${idx}`} className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-1.5"><p className="text-xs"><span className="font-medium">{itemMap.get(item.menuItem)?.name?.substring(0, 20) || "Item"}</span><span className="ml-1 text-slate-600">x{item.quantity}</span></p><button type="button" onClick={() => removeDraftItem(idx)} className="text-red-500">✕</button></div>)}</div>}
              </div>
              <button type="submit" disabled={loading || !draftItems.length} className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300">{loading ? "Sending..." : "Send to Kitchen"}</button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3"><h2 className="text-base font-bold text-slate-900">Kitchen Orders ({activeOrders.length})</h2></div>
              <div className="max-h-[calc(100vh-280px)] divide-y divide-slate-100 overflow-auto p-2">
                {activeOrders.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">No active orders</div>
                ) : (
                  activeOrders.map((order) => {
                    const cfg = getStatusConfig(order.status);
                    const next = getNextStatus(order.status);
                    return (
                      <div key={order._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 m-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-slate-900">{order.orderNumber}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">
                              <span className="font-medium">Table {order.tableNumber}</span>
                              <span className="mx-1.5">•</span>
                              <span>{formatTime(order.createdAt)}</span>
                            </p>
                            <p className="mt-1.5 text-xs text-slate-700 line-clamp-2">
                              {order.items?.map((i, iIdx) => `${i.name} x${i.quantity}`).join(", ")}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-900">Total: ₹{Number(order.grandTotal || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        {next && (
                          <div className="mt-3">
                            <button onClick={() => updateStatus(order._id, next)} className="flex-1 w-full rounded-md bg-emerald-600 py-1.5 text-xs font-semibold text-white">
                              {getStatusLabel(order.status)}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {servedOrders.length > 0 && <div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-bold text-slate-900">Recently Served ({servedOrders.length})</h2></div><div className="max-h-48 overflow-auto p-2">{servedOrders.slice(0, 5).map(o => <div key={o._id} className="flex items-center justify-between rounded-md bg-purple-50 px-3 py-2 mb-1"><div><span className="text-xs font-medium text-slate-900">{o.orderNumber}</span><span className="ml-2 text-xs text-slate-600">Table {o.tableNumber}</span></div><span className="text-[10px] text-purple-600">{formatTime(o.updatedAt)}</span></div>)}</div></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waiter_Orders;


import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import menuService from "../../services/menu_Service";
import orderService from "../../services/order_Service";

const Waiter_Orders = () => {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    tableNumber: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
    menuItem: "",
    quantity: 1,
    itemNote: "",
  });
  const [draftItems, setDraftItems] = useState([]);

  const itemMap = useMemo(() => {
    const map = new Map();
    for (const item of menuItems) map.set(item._id, item);
    return map;
  }, [menuItems]);

  const loadData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        menuService.getPublicMenu(),
        orderService.getOrders(token),
      ]);
      setMenuItems(menuRes.items || []);
      setOrders(ordersRes.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load waiter data");
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addDraftItem = () => {
    if (!form.menuItem) return;
    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) return;
    setDraftItems((prev) => [
      ...prev,
      { menuItem: form.menuItem, quantity: Math.floor(quantity), notes: form.itemNote || "" },
    ]);
    setForm((prev) => ({ ...prev, menuItem: "", quantity: 1, itemNote: "" }));
  };

  const removeDraftItem = (index) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const createOrder = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (!form.tableNumber || !draftItems.length) {
        setMessage("Table number and at least one item are required");
        return;
      }
      await orderService.createOrder(token, {
        tableNumber: form.tableNumber,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        notes: form.notes,
        items: draftItems,
      });
      setMessage("Order created and sent to kitchen");
      setForm({
        tableNumber: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        notes: "",
        menuItem: "",
        quantity: 1,
        itemNote: "",
      });
      setDraftItems([]);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Order creation failed");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(token, orderId, status);
      setMessage(`Order marked as ${status}`);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Status update failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Waiter Orders</h2>
        <p className="mt-1 text-sm text-slate-600">
          Take table orders and send directly to kitchen workflow.
        </p>
        {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createOrder} className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-xl font-bold text-slate-900">Create New Order</h3>
          <div className="mt-4 grid gap-3">
            <input
              type="text"
              placeholder="Table Number"
              value={form.tableNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, tableNumber: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2"
              required
            />
            <textarea
              placeholder="Order Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2"
              rows={2}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Customer Name"
                value={form.customerName}
                onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                className="rounded-xl border border-slate-300 px-3 py-2"
              />
              <input
                type="email"
                placeholder="Customer Email"
                value={form.customerEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                className="rounded-xl border border-slate-300 px-3 py-2"
              />
              <input
                type="text"
                placeholder="Customer Phone"
                value={form.customerPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                className="rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <p className="text-sm font-bold text-slate-800">Add Items</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_90px_1fr_100px]">
                <select
                  value={form.menuItem}
                  onChange={(e) => setForm((prev) => ({ ...prev, menuItem: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Select Menu Item</option>
                  {menuItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (${Number(item.price || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="text"
                  placeholder="Item note"
                  value={form.itemNote}
                  onChange={(e) => setForm((prev) => ({ ...prev, itemNote: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={addDraftItem}
                  className="rounded-lg bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {draftItems.map((item, index) => (
                  <div key={`${item.menuItem}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <p>
                      {itemMap.get(item.menuItem)?.name || "Item"} x{item.quantity}
                      {item.notes ? ` (${item.notes})` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeDraftItem(index)}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!draftItems.length ? <p className="text-xs text-slate-500">No items added yet.</p> : null}
              </div>
            </div>

            <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
              Send Order To Kitchen
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-xl font-bold text-slate-900">My Orders</h3>
          <div className="mt-4 max-h-[36rem] space-y-2 overflow-auto pr-1">
            {orders.map((order) => (
              <div key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">
                    {order.orderNumber} | Table {order.tableNumber}
                  </p>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold">
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                </p>
                <p className="mt-1 text-xs text-slate-500">Total: ${Number(order.grandTotal || 0).toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {order.customerName || "Guest"} {order.customerEmail ? `| ${order.customerEmail}` : ""}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => updateStatus(order._id, "served")}
                    className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Mark Served
                  </button>
                  <button
                    onClick={() => updateStatus(order._id, "cancelled")}
                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
            {!orders.length ? <p className="text-sm text-slate-500">No orders yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Waiter_Orders;

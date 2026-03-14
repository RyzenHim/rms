import { useEffect, useMemo, useState } from "react";
import { FiArchive, FiAlertTriangle, FiLayers, FiPlus, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import api, { withAuth } from "../../services/api";

const initialForm = {
  name: "",
  description: "",
  category: "vegetables",
  unit: "kg",
  currentStock: 0,
  minimumThreshold: 10,
  maximumStock: 100,
  unitCost: 0,
  supplier: "",
  location: "",
};

const AdminInventory = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!token) return;
    loadInventory();
    loadCategories();
  }, [filterCategory, token]);

  const loadInventory = async () => {
    try {
      const query = filterCategory === "all" ? "" : `?category=${encodeURIComponent(filterCategory)}`;
      const { data } = await api.get(`/inventory${query}`, withAuth(token));
      setItems(data?.items || []);
      setStats(data?.stats || null);
      setMessage("");
    } catch (err) {
      setItems([]);
      setStats(null);
      setMessage(err?.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/inventory/categories", withAuth(token));
      setCategories(data?.categories || []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const resetForm = () => setFormData(initialForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/inventory/${editingId}`, formData, withAuth(token));
      } else {
        await api.post("/inventory", formData, withAuth(token));
      }
      setMessage(`Item ${editingId ? "updated" : "created"} successfully`);
      resetForm();
      setEditingId(null);
      setShowForm(false);
      loadInventory();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      ...item,
      currentStock: Number(item.currentStock || 0),
      minimumThreshold: Number(item.minimumThreshold || 0),
      maximumStock: Number(item.maximumStock || 0),
      unitCost: Number(item.unitCost || 0),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/inventory/${id}`, withAuth(token));
      setMessage("Item deleted successfully");
      loadInventory();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to delete item");
    }
  };

  const updateStock = async (id, type) => {
    const quantityInput = prompt(`Enter quantity to ${type}:`, "1");
    if (!quantityInput) return;
    const quantity = parseInt(quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("Please enter a valid positive quantity");
      return;
    }
    try {
      await api.patch(`/inventory/${id}/stock`, { quantity, type }, withAuth(token));
      setMessage(`Stock ${type}ed successfully`);
      loadInventory();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to update stock");
    }
  };

  const getStockStatus = (item) => {
    if (item.currentStock < item.minimumThreshold) {
      return { label: "Low Stock", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" };
    }
    if (item.currentStock >= item.maximumStock) {
      return { label: "Full", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" };
    }
    return { label: "In Stock", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" };
  };

  const overview = useMemo(
    () => [
      { label: "Total Items", value: stats?.totalItems || 0, icon: FiLayers, tone: "from-sky-500 to-cyan-400" },
      { label: "Low Stock Alerts", value: stats?.lowStockItems || 0, icon: FiAlertTriangle, tone: "from-rose-500 to-orange-400" },
      { label: "Inventory Value", value: `Rs ${Number(stats?.totalValue || 0).toLocaleString()}`, icon: FiTrendingUp, tone: "from-emerald-500 to-teal-400" },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Stock Control
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Inventory Management</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Track supply levels, cost value, and replenishment thresholds from a cleaner operations panel.
            </p>
          </div>
          <button onClick={() => setShowForm((prev) => !prev)} className="btn-primary inline-flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            {showForm ? "Close Form" : "Add Item"}
          </button>
        </div>
      </section>

      {message ? <div className={message.includes("successfully") ? "alert-success" : "alert-error"}>{message}</div> : null}

      {stats ? (
        <section className="grid gap-4 md:grid-cols-3">
          {overview.map((card, index) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className={`card-elevated animate-fade-in-up stagger-${index + 1} smooth-transform p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{card.label}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{card.value}</p>
                  </div>
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="card-elevated animate-fade-in-up p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg">
              <FiArchive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{editingId ? "Edit Inventory Item" : "Add New Item"}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Use the form below to create or update stock records.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input type="text" placeholder="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-base" required />
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-base">
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input-base">
              <option value="kg">Kilogram (kg)</option>
              <option value="liters">Liters (L)</option>
              <option value="pieces">Pieces</option>
              <option value="packets">Packets</option>
              <option value="dozen">Dozen</option>
            </select>
            <input type="number" placeholder="Current Stock" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value || "0", 10) })} className="input-base" required />
            <input type="number" placeholder="Minimum Threshold" value={formData.minimumThreshold} onChange={(e) => setFormData({ ...formData, minimumThreshold: parseInt(e.target.value || "0", 10) })} className="input-base" required />
            <input type="number" placeholder="Maximum Stock" value={formData.maximumStock} onChange={(e) => setFormData({ ...formData, maximumStock: parseInt(e.target.value || "0", 10) })} className="input-base" required />
            <input type="number" placeholder="Unit Cost (Rs)" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value || "0") })} className="input-base" step="0.01" required />
            <input type="text" placeholder="Supplier Name" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="input-base" />
            <input type="text" placeholder="Storage Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-base" />
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-base md:col-span-2 xl:col-span-3 min-h-[6rem]" rows={3} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : editingId ? "Update Item" : "Add Item"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }} className="btn-outline">Cancel</button>
          </div>
        </form>
      ) : null}

      <section className="card-elevated animate-fade-in-up stagger-1 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Inventory List</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Filter stock by category and manage quantities without leaving the page.</p>
          </div>
          <div className="w-full md:w-72">
            <label className="form-label">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setLoading(true);
              }}
              className="input-base"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Loading inventory...</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[58rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item._id} className="border-b border-slate-200/40 transition-colors hover:bg-white/20 dark:border-slate-700/40 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.supplier || "No supplier"}</p>
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">{item.category}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">{item.currentStock} {item.unit}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Min {item.minimumThreshold} / Max {item.maximumStock}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-50">
                        Rs {(Number(item.currentStock || 0) * Number(item.unitCost || 0)).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button onClick={() => updateStock(item._id, "add")} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">Add</button>
                          <button onClick={() => updateStock(item._id, "subtract")} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">Use</button>
                          <button onClick={() => handleEdit(item)} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">Edit</button>
                          <button onClick={() => handleDelete(item._id)} className="glass-pill rounded-full px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminInventory;

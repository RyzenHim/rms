import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

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

  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    loadInventory();
    loadCategories();
  }, [filterCategory]);

  const loadInventory = async () => {
    try {
      const url = filterCategory === "all" 
        ? `${import.meta.env.VITE_API_URL}/api/inventory` 
        : `${import.meta.env.VITE_API_URL}/api/inventory?category=${filterCategory}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setItems(data.items);
      setStats(data.stats);
    } catch (err) {
      setMessage("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      console.error("Failed to load categories");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId
        ? `${import.meta.env.VITE_API_URL}/api/inventory/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/inventory`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Item ${editingId ? "updated" : "created"} successfully`);
        setFormData({
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
        });
        setEditingId(null);
        setShowForm(false);
        loadInventory();
      } else {
        setMessage(data.message || "Failed to save item");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage("Item deleted successfully");
        loadInventory();
      } else {
        setMessage("Failed to delete item");
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateStock = async (id, type) => {
    const quantity = prompt(`Enter quantity to ${type}:`, "1");
    if (!quantity) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: parseInt(quantity), type }),
      });

      if (response.ok) {
        setMessage(`Stock ${type}ed successfully`);
        loadInventory();
      } else {
        setMessage("Failed to update stock");
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const getStockStatus = (item) => {
    if (item.currentStock < item.minimumThreshold) return { label: "Low Stock", color: "bg-red-100 text-red-800" };
    if (item.currentStock >= item.maximumStock) return { label: "Full", color: "bg-green-100 text-green-800" };
    return { label: "In Stock", color: "bg-blue-100 text-blue-800" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="heading-2"> Inventory Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-elevated p-6">
            <p className="text-sm text-slate-600 mb-2">Total Items</p>
            <p className="heading-3">{stats.totalItems}</p>
          </div>
          <div className="card-elevated p-6">
            <p className="text-sm text-slate-600 mb-2">Low Stock Alerts</p>
            <p className="heading-3 text-red-600">{stats.lowStockItems}</p>
          </div>
          <div className="card-elevated p-6">
            <p className="text-sm text-slate-600 mb-2">Total Inventory Value</p>
            <p className="heading-3">₹{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
          <h3 className="heading-4">{editingId ? "Edit Item" : "Add New Item"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-base"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-base"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="input-base"
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="liters">Liters (L)</option>
              <option value="pieces">Pieces</option>
              <option value="packets">Packets</option>
              <option value="dozen">Dozen</option>
            </select>
            <input
              type="number"
              placeholder="Current Stock"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) })}
              className="input-base"
              required
            />
            <input
              type="number"
              placeholder="Minimum Threshold"
              value={formData.minimumThreshold}
              onChange={(e) => setFormData({ ...formData, minimumThreshold: parseInt(e.target.value) })}
              className="input-base"
              required
            />
            <input
              type="number"
              placeholder="Maximum Stock"
              value={formData.maximumStock}
              onChange={(e) => setFormData({ ...formData, maximumStock: parseInt(e.target.value) })}
              className="input-base"
              required
            />
            <input
              type="number"
              placeholder="Unit Cost (₹)"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
              className="input-base"
              step="0.01"
              required
            />
            <input
              type="text"
              placeholder="Supplier Name"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="input-base"
            />
            <input
              type="text"
              placeholder="Storage Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input-base"
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-base w-full"
            rows="2"
          />
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div>
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
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      {loading ? (
        <p className="text-center py-8 text-slate-600">Loading inventory...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Item</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Value</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.supplier}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">{item.category}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.currentStock} {item.unit}</p>
                      <p className="text-xs text-slate-500">Min: {item.minimumThreshold}, Max: {item.maximumStock}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">₹{(item.currentStock * item.unitCost).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => updateStock(item._id, "add")} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                           Add
                        </button>
                        <button onClick={() => updateStock(item._id, "subtract")} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                           Use
                        </button>
                        <button onClick={() => handleEdit(item)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                           Edit
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                           Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;

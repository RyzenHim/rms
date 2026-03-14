import { useEffect, useState } from "react";
import { FiGrid, FiLayers, FiMapPin, FiPlus, FiTool } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import api, { withAuth } from "../../services/api";

const emptyForm = {
  tableNumber: "",
  capacity: 2,
  location: "center",
  shape: "round",
  description: "",
};

const statusStyles = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  reserved: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  occupied: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  maintenance: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const AdminTableManager = () => {
  const { token } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!token) return;
    fetchTables();
    fetchStats();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await api.get("/tables", withAuth(token));
      setTables(response.data.tables || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/tables/stats/all", withAuth(token));
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value, 10) : value,
    }));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTable(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.tableNumber || !formData.capacity) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      if (editingTable) {
        const response = await api.put(`/tables/${editingTable._id}`, formData, withAuth(token));
        setTables((prev) => prev.map((table) => (table._id === editingTable._id ? response.data.table : table)));
      } else {
        const response = await api.post("/tables", formData, withAuth(token));
        setTables((prev) => [...prev, response.data.table]);
      }
      resetForm();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save table");
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      shape: table.shape,
      description: table.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    try {
      await api.delete(`/tables/${tableId}`, withAuth(token));
      setTables((prev) => prev.filter((table) => table._id !== tableId));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete table");
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      const response = await api.patch(`/tables/${tableId}/status`, { status: newStatus }, withAuth(token));
      setTables((prev) => prev.map((table) => (table._id === tableId ? response.data.table : table)));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update table status");
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Floor Layout
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Table Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Manage seating inventory, layout metadata, and table availability with a more polished operations view.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </section>

      {stats ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total", value: stats.totalTables, icon: FiLayers, tone: "from-emerald-500 to-teal-400" },
            { label: "Available", value: stats.available, icon: FiGrid, tone: "from-sky-500 to-cyan-400" },
            { label: "Reserved", value: stats.reserved, icon: FiMapPin, tone: "from-amber-400 to-orange-500" },
            { label: "Occupied", value: stats.occupied, icon: FiTool, tone: "from-fuchsia-500 to-violet-500" },
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className={`card-elevated animate-fade-in-up stagger-${Math.min(index + 1, 4)} smooth-transform p-5`}>
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

      {error ? <div className="alert-error">{error}</div> : null}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="glass-panel rounded-full p-4"><div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="card-elevated p-10 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No tables found.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5">Create Your First Table</button>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table, index) => (
            <article key={table._id} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">Table {table.tableNumber}</h3>
                  <p className="mt-1 text-sm capitalize text-slate-600 dark:text-slate-300">{table.location}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[table.status] || statusStyles.available}`}>{table.status}</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="glass-subtle rounded-2xl p-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Capacity</span><span className="font-semibold text-slate-900 dark:text-slate-50">{table.capacity} guests</span></div>
                  <div className="mt-2 flex justify-between"><span className="text-slate-500 dark:text-slate-400">Shape</span><span className="font-semibold capitalize text-slate-900 dark:text-slate-50">{table.shape}</span></div>
                  {table.description ? <div className="mt-2"><span className="text-slate-500 dark:text-slate-400">Notes</span><p className="mt-1 text-xs text-slate-700 dark:text-slate-200">{table.description}</p></div> : null}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Change Status</label>
                  <select value={table.status} onChange={(e) => handleStatusChange(table._id, e.target.value)} className="input-base text-sm">
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => handleEdit(table)} className="btn-secondary flex-1 text-sm">Edit</button>
                <button onClick={() => handleDelete(table._id)} className="btn-danger flex-1 text-sm">Delete</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] p-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">{editingTable ? "Edit Table" : "Add New Table"}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Configure seating metadata, capacity, and placement details.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input type="text" name="tableNumber" value={formData.tableNumber} onChange={handleInputChange} placeholder="e.g., T01, A1, 1" className="input-base" required />
              <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-base">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((num) => <option key={num} value={num}>{num} guests</option>)}
              </select>
              <select name="location" value={formData.location} onChange={handleInputChange} className="input-base">
                <option value="window">Window</option>
                <option value="corner">Corner</option>
                <option value="center">Center</option>
                <option value="outdoor">Outdoor</option>
                <option value="private">Private</option>
              </select>
              <select name="shape" value={formData.shape} onChange={handleInputChange} className="input-base">
                <option value="round">Round</option>
                <option value="square">Square</option>
                <option value="rectangular">Rectangular</option>
              </select>
              <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Optional notes about the table..." rows={3} className="input-base min-h-[6rem]" />

              <div className="flex gap-3">
                <button type="button" onClick={resetForm} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editingTable ? "Update Table" : "Add Table"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminTableManager;

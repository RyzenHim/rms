import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminTableManager = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: "",
    capacity: 2,
    location: "center",
    shape: "round",
    description: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTables();
    fetchStats();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/tables", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const response = await axios.get("/api/tables/stats/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "capacity" ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tableNumber || !formData.capacity) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (editingTable) {
        const response = await axios.put(
          `/api/tables/${editingTable._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTables(
          tables.map((t) => (t._id === editingTable._id ? response.data.table : t))
        );
      } else {
        const response = await axios.post("/api/tables", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTables([...tables, response.data.table]);
      }

      setShowForm(false);
      setEditingTable(null);
      setFormData({
        tableNumber: "",
        capacity: 2,
        location: "center",
        shape: "round",
        description: "",
      });

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
      await axios.delete(`/api/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(tables.filter((t) => t._id !== tableId));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete table");
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      const response = await axios.patch(
        `/api/tables/${tableId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTables(tables.map((t) => (t._id === tableId ? response.data.table : t)));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update table status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-800",
      reserved: "bg-yellow-100 text-yellow-800",
      occupied: "bg-blue-100 text-blue-800",
      maintenance: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingTable(null);
    setFormData({
      tableNumber: "",
      capacity: 2,
      location: "center",
      shape: "round",
      description: "",
    });
  };

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Table Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg transition text-sm sm:text-base"
        >
          + Add Table
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-green-50 border-l-4 border-green-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Total</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.total}</p>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Available</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.available}</p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Reserved</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.reserved}</p>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Occupied</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.occupied}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Tables Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-600 text-base mb-4">No tables found</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Create Your First Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {tables.map((table) => (
            <div
              key={table._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 sm:p-4 md:p-6"
            >
              <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Table {table.tableNumber}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm capitalize">{table.location}</p>
                </div>
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                    table.status
                  )}`}
                >
                  {table.status}
                </span>
              </div>

              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium text-gray-900">{table.capacity} guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shape:</span>
                  <span className="font-medium text-gray-900 capitalize">{table.shape}</span>
                </div>
                {table.description && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-700 text-xs break-words">{table.description}</p>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Change Status
                </label>
                <select
                  value={table.status}
                  onChange={(e) => handleStatusChange(table._id, e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(table)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 rounded transition text-xs sm:text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(table._id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
              {editingTable ? "Edit Table" : "Add New Table"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-3 sm:space-y-4">
                {/* Table Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Table Number*
                  </label>
                  <input
                    type="number"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 1, 2, 3..."
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Capacity*
                  </label>
                  <select
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} guests
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="window">Window</option>
                    <option value="corner">Corner</option>
                    <option value="center">Center</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                {/* Shape */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Shape
                  </label>
                  <select
                    name="shape"
                    value={formData.shape}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="round">Round</option>
                    <option value="square">Square</option>
                    <option value="rectangular">Rectangular</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional notes about the table..."
                    rows="2"
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
                >
                  {editingTable ? "Update Table" : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTableManager;

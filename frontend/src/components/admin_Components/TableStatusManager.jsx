import { useEffect, useState } from "react";
import { FiRefreshCw, FiEdit2, FiInfo } from "react-icons/fi";
import api, { withAuth } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const TableStatusManager = () => {
    const { token } = useAuth();
    const [tables, setTables] = useState([]);
    const [filteredTables, setFilteredTables] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [selectedTable, setSelectedTable] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const statusColors = {
        available: { bg: "bg-emerald-100", text: "text-emerald-800", badge: "badge-emerald" },
        reserved: { bg: "bg-blue-100", text: "text-blue-800", badge: "badge-blue" },
        occupied: { bg: "bg-orange-100", text: "text-orange-800", badge: "badge-orange" },
        maintenance: { bg: "bg-red-100", text: "text-red-800", badge: "badge-red" },
    };

    const loadTables = async () => {
        setLoading(true);
        try {
            // baseURL already includes "/api", so we just call "/tables"
            const { data } = await api.get("/tables", withAuth(token));
            setTables(data.tables || []);
            setMessage("");
        } catch (error) {
            setMessageType("error");
            setMessage(error?.response?.data?.message || "Failed to load tables");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTables();
    }, []);

    useEffect(() => {
        let filtered = tables;

        if (statusFilter) {
            filtered = filtered.filter((t) => t.status === statusFilter);
        }

        if (search) {
            filtered = filtered.filter(
                (t) =>
                    t.tableNumber.toLowerCase().includes(search.toLowerCase()) ||
                    t.location.toLowerCase().includes(search.toLowerCase())
            );
        }

        setFilteredTables(filtered);
    }, [tables, statusFilter, search]);

    const updateTableStatus = async (tableId, newStatus) => {
        setUpdatingId(tableId);
        try {
            const { data } = await api.patch(
                `/tables/${tableId}/status`,
                { status: newStatus },
                withAuth(token)
            );

            setTables((prev) =>
                prev.map((t) => (t._id === tableId ? data.table : t))
            );

            setMessageType("success");
            setMessage(`Table ${data.table.tableNumber} status updated to ${newStatus}`);
            setSelectedTable(null);
        } catch (error) {
            setMessageType("error");
            setMessage(error?.response?.data?.message || "Failed to update table status");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Table Status Management</h2>
                <button
                    onClick={loadTables}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                    <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-lg ${messageType === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                >
                    {message}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <input
                    type="text"
                    placeholder="Search by table number or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin">
                        <FiRefreshCw className="h-8 w-8 text-emerald-600" />
                    </div>
                </div>
            ) : filteredTables.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <FiInfo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No tables found
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredTables.map((table) => (
                        <div
                            key={table._id}
                            className={`rounded-lg p-4 border-2 transition-all ${statusColors[table.status]?.bg || "bg-gray-100"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Table {table.tableNumber}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Capacity: {table.capacity} persons
                                    </p>
                                </div>
                                <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusColors[table.status]?.text || "text-gray-900"}`}
                                >
                                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                                </span>
                            </div>

                            <div className="mb-4 space-y-2 text-sm">
                                <p className="text-gray-700">
                                    <span className="font-semibold">Location:</span> {table.location}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Shape:</span> {table.shape}
                                </p>
                                {table.remarks && (
                                    <p className="text-gray-700">
                                        <span className="font-semibold">Remarks:</span> {table.remarks}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedTable(selectedTable?._id === table._id ? null : table)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                                >
                                    <FiEdit2 className="h-4 w-4" />
                                    Change Status
                                </button>

                                {selectedTable?._id === table._id && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {["available", "reserved", "occupied", "maintenance"].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => updateTableStatus(table._id, status)}
                                                disabled={updatingId === table._id || table.status === status}
                                                className={`px-2 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50 ${table.status === status
                                                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                                        : statusColors[status]?.bg +
                                                        " " +
                                                        statusColors[status]?.text +
                                                        " hover:shadow-md"
                                                    }`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TableStatusManager;

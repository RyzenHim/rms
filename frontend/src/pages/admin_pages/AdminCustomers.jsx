import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import customerService from "../../services/customer_Service";

const AdminCustomers = () => {
    const { token } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        loyaltyPoints: 0,
        isActive: true,
        isBlocked: false,
    });

    const loadCustomers = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (statusFilter) params.isActive = statusFilter;

            const res = await customerService.getCustomers(token, params);
            setCustomers(res.customers || []);
            setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setMessage({ type: "error", text: err?.response?.data?.message || "Failed to load customers" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e) => {
        e.preventDefault();
        loadCustomers(1);
    };

    const viewCustomerDetails = async (customer) => {
        try {
            const res = await customerService.getCustomerById(token, customer.id);
            setSelectedCustomer(res.customer);
            setCustomerOrders(res.orders || []);
            setShowModal(true);
        } catch (err) {
            setMessage({ type: "error", text: err?.response?.data?.message || "Failed to load customer details" });
        }
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setForm({
            name: customer.name || "",
            phone: customer.phone || "",
            loyaltyPoints: customer.loyaltyPoints || 0,
            isActive: customer.isActive ?? true,
            isBlocked: customer.isBlocked ?? false,
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await customerService.updateCustomer(token, editingCustomer.id, form);
            setMessage({ type: "success", text: "Customer updated successfully" });
            setEditingCustomer(null);
            loadCustomers(pagination.page);
        } catch (err) {
            setMessage({ type: "error", text: err?.response?.data?.message || "Failed to update customer" });
        }
    };

    const handleToggleStatus = async (customer) => {
        const newStatus = !customer.isActive;
        try {
            await customerService.toggleCustomerStatus(token, customer.id, newStatus);
            setMessage({ type: "success", text: newStatus ? "Customer activated" : "Customer deactivated" });
            loadCustomers(pagination.page);
        } catch (err) {
            setMessage({ type: "error", text: err?.response?.data?.message || "Failed to update status" });
        }
    };

    const handleDelete = async (customer) => {
        if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            return;
        }
        try {
            await customerService.deleteCustomer(token, customer.id);
            setMessage({ type: "success", text: "Customer deleted successfully" });
            loadCustomers(pagination.page);
        } catch (err) {
            setMessage({ type: "error", text: err?.response?.data?.message || "Failed to delete customer" });
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString();
    };

    const formatCurrency = (amount) => {
        return `Rs ${Number(amount || 0).toFixed(2)}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black text-slate-900">Customer Management</h2>
                <p className="mt-1 text-sm text-slate-600">View and manage customer accounts, orders, and loyalty points.</p>
                {message.text ? (
                    <p className={`mt-2 rounded-xl px-3 py-2 text-sm font-medium ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {message.text}
                    </p>
                ) : null}
            </div>

            {/* Search and Filters */}
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-2"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-2"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button type="submit" className="rounded-xl bg-emerald-700 px-6 py-2 text-sm font-semibold text-white">
                    Search
                </button>
            </form>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Total Customers</p>
                    <p className="text-2xl font-black text-slate-900">{pagination.total}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Active</p>
                    <p className="text-2xl font-black text-emerald-600">{customers.filter(c => c.isActive).length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Inactive</p>
                    <p className="text-2xl font-black text-red-600">{customers.filter(c => !c.isActive).length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Total Revenue</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0))}</p>
                </div>
            </div>

            {/* Customer List */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                            <tr>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">Orders</th>
                                <th className="px-4 py-3">Total Spent</th>
                                <th className="px-4 py-3">Loyalty Points</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No customers found</td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">{customer.name}</p>
                                            <p className="text-xs text-slate-500">Since: {formatDate(customer.createdAt)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-700">{customer.email || "N/A"}</p>
                                            <p className="text-xs text-slate-500">{customer.phone || "No phone"}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-900">{customer.totalOrders || 0}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-emerald-600">{formatCurrency(customer.totalSpent)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-900">{customer.loyaltyPoints || 0}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${customer.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                {customer.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => viewCustomerDetails(customer)}
                                                    className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(customer)}
                                                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(customer)}
                                                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${customer.isActive ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                                                >
                                                    {customer.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer)}
                                                    className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                        <p className="text-sm text-slate-600">
                            Page {pagination.page} of {pagination.pages} ({pagination.total} customers)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadCustomers(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => loadCustomers(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Customer Details Modal */}
            {showModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Customer Details</h3>
                                <p className="text-sm text-slate-600">{selectedCustomer.email}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-2 hover:bg-slate-100">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            {/* Customer Info */}
                            <div className="space-y-4">
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h4 className="mb-3 font-semibold text-slate-900">Profile Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedCustomer.name}</span></p>
                                        <p><span className="text-slate-500">Email:</span> <span className="font-medium">{selectedCustomer.email || "N/A"}</span></p>
                                        <p><span className="text-slate-500">Phone:</span> <span className="font-medium">{selectedCustomer.phone || "N/A"}</span></p>
                                        <p><span className="text-slate-500">Member Since:</span> <span className="font-medium">{formatDate(selectedCustomer.createdAt)}</span></p>
                                        <p><span className="text-slate-500">Status:</span>
                                            <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${selectedCustomer.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                {selectedCustomer.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h4 className="mb-3 font-semibold text-slate-900">Order Statistics</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-slate-900">{selectedCustomer.totalOrders || 0}</p>
                                            <p className="text-xs text-slate-500">Total Orders</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-emerald-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                                            <p className="text-xs text-slate-500">Total Spent</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-amber-600">{selectedCustomer.loyaltyPoints || 0}</p>
                                            <p className="text-xs text-slate-500">Loyalty Points</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-slate-900">{formatDate(selectedCustomer.lastOrderDate)}</p>
                                            <p className="text-xs text-slate-500">Last Order</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order History */}
                            <div>
                                <h4 className="mb-3 font-semibold text-slate-900">Order History</h4>
                                <div className="max-h-80 space-y-2 overflow-auto rounded-xl border border-slate-200">
                                    {customerOrders.length === 0 ? (
                                        <p className="p-4 text-center text-sm text-slate-500">No orders found</p>
                                    ) : (
                                        customerOrders.map((order) => (
                                            <div key={order._id} className="border-b border-slate-100 p-3 last:border-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-mono text-sm font-bold text-slate-900">{order.orderNumber}</p>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${order.status === "served" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Table {order.tableNumber} • {formatDate(order.createdAt)} • {order.items?.length || 0} items
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-emerald-600">{formatCurrency(order.grandTotal)}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900">Edit Customer</h3>
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Loyalty Points</label>
                                <input
                                    type="number"
                                    value={form.loyaltyPoints}
                                    onChange={(e) => setForm({ ...form, loyaltyPoints: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-slate-700">Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.isBlocked}
                                        onChange={(e) => setForm({ ...form, isBlocked: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-slate-700">Blocked</span>
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 rounded-xl bg-emerald-700 py-2 text-sm font-semibold text-white">
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
                                    className="flex-1 rounded-xl border border-slate-300 py-2 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;


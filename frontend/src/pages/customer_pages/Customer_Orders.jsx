import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order_Service";

const Customer_Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to load your orders");
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 12000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: '⏳', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { icon: '✅', color: 'bg-blue-100 text-blue-800' },
      preparing: { icon: '👨‍🍳', color: 'bg-orange-100 text-orange-800' },
      ready: { icon: '🎉', color: 'bg-green-100 text-green-800' },
      served: { icon: '✨', color: 'bg-emerald-100 text-emerald-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return { ...config, icon: config.icon };
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#fafaf9' }}>
      <section className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="space-y-2 mb-8">
          <h1 className="heading-1">📦 Order History</h1>
          <p className="text-lg text-slate-600">Track the status of your orders from placement to delivery</p>
        </div>

        {message && <div className="alert-error mb-6">{message}</div>}

        <div className="space-y-4">
          {orders.length ? (
            orders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              return (
                <article key={order._id} className="card-elevated p-6 space-y-4 hover-lift transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="heading-4">{order.orderNumber}</h2>
                        <span className={`badge-small ${statusBadge.color} px-3 py-1 rounded-full font-bold text-xs`}>
                          {statusBadge.icon} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">📅 {orderDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="heading-5" style={{ color: '#10b981' }}>₹{Number(order.grandTotal || 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-600">🪑 Table {order.tableNumber}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="heading-5 mb-3 text-slate-900">Items Ordered:</h3>
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-emerald-600">₹{Number(item.unitPrice * item.quantity || 0).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600 font-semibold mb-1">Customer</p>
                      <p className="font-semibold">{order.customerName}</p>
                      <p className="text-xs">{order.customerPhone || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600 font-semibold mb-1">Contact</p>
                      <p className="text-xs break-all">{order.customerEmail || 'N/A'}</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="alert-info bg-blue-50 border-l-4" style={{ borderColor: '#0b6b49' }}>
                      <p className="text-xs font-semibold text-slate-700">Special Requests:</p>
                      <p className="text-sm text-slate-700 mt-1">{order.notes}</p>
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <div className="card-elevated p-12 text-center space-y-4">
              <p className="text-4xl">📭</p>
              <p className="heading-4">No Orders Yet</p>
              <p className="text-slate-600">Start ordering amazing food from our menu!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Customer_Orders;

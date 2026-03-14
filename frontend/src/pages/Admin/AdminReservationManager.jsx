import { useEffect, useState } from "react";
import { FiCalendar, FiCheckCircle, FiClock, FiUsers, FiX } from "react-icons/fi";
import axios from "axios";

const statusStyles = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  confirmed: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  arrived: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  completed: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "no-show": "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const AdminReservationManager = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "all",
  });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [stats, setStats] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchReservations();
    fetchStats();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = { date: filters.date };
      if (filters.status !== "all") params.status = filters.status;
      const response = await axios.get("/api/reservations", { params, headers: { Authorization: `Bearer ${token}` } });
      setReservations(response.data.reservations || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reservations");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/reservations/stats", { headers: { Authorization: `Bearer ${token}` } });
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const syncReservation = (reservationId, updatedReservation) => {
    setReservations((prev) => prev.map((reservation) => (reservation._id === reservationId ? updatedReservation : reservation)));
    fetchStats();
  };

  const handleCheckIn = async (reservationId) => {
    try {
      const response = await axios.patch(`/api/reservations/${reservationId}/checkin`, {}, { headers: { Authorization: `Bearer ${token}` } });
      syncReservation(reservationId, response.data.reservation);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (reservationId) => {
    try {
      const response = await axios.patch(`/api/reservations/${reservationId}/checkout`, {}, { headers: { Authorization: `Bearer ${token}` } });
      syncReservation(reservationId, response.data.reservation);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to check out");
    }
  };

  const handleNoShow = async (reservationId) => {
    if (!window.confirm("Mark this reservation as no-show?")) return;
    try {
      const response = await axios.patch(`/api/reservations/${reservationId}/no-show`, {}, { headers: { Authorization: `Bearer ${token}` } });
      syncReservation(reservationId, response.data.reservation);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as no-show");
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const renderActions = (reservation) => (
    <div className="flex flex-wrap gap-2">
      {reservation.status === "confirmed" ? (
        <button onClick={() => handleCheckIn(reservation._id)} className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          Check-In
        </button>
      ) : null}
      {reservation.status === "arrived" ? (
        <button onClick={() => handleCheckOut(reservation._id)} className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
          Check-Out
        </button>
      ) : null}
      {["confirmed", "arrived"].includes(reservation.status) ? (
        <button onClick={() => handleNoShow(reservation._id)} className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
          No-Show
        </button>
      ) : null}
      <button onClick={() => setSelectedReservation(reservation)} className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
        Details
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise-in rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
              Reservation Desk
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Reservation Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Track arrivals, no-shows, and same-day service flow through a cleaner reservation operations board.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="glass-subtle flex items-center gap-3 rounded-[1.3rem] px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              <FiCalendar className="h-4 w-4" />
              <input type="date" value={filters.date} onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))} className="w-full bg-transparent outline-none" />
            </label>
            <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="input-base text-sm">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="arrived">Arrived</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No-Show</option>
            </select>
          </div>
        </div>
      </section>

      {stats ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Today's", value: stats.todayReservations, icon: FiCalendar, tone: "from-sky-500 to-cyan-400" },
            { label: "Guests", value: stats.totalGuests, icon: FiUsers, tone: "from-emerald-500 to-teal-400" },
            { label: "Arrived", value: stats.arrivedToday, icon: FiCheckCircle, tone: "from-amber-400 to-orange-500" },
            { label: "Completed", value: stats.completedThisMonth, icon: FiClock, tone: "from-fuchsia-500 to-violet-500" },
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
      ) : reservations.length === 0 ? (
        <div className="card-elevated p-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No reservations found for the selected date.</div>
      ) : (
        <>
          <section className="card-elevated hidden overflow-x-auto p-4 lg:block">
            <table className="w-full min-w-[72rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Occasion</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation._id} className="border-b border-slate-200/40 transition-colors hover:bg-white/20 dark:border-slate-700/40 dark:hover:bg-slate-900/10">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{reservation.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{reservation.customerEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{reservation.table?.tableNumber}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Cap: {reservation.table?.capacity}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{formatDate(reservation.reservationDate)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-50">{reservation.reservationTime}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-50">{reservation.numberOfGuests}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[reservation.status] || statusStyles.pending}`}>{reservation.status}</span></td>
                    <td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">{reservation.occasion || "Standard"}</td>
                    <td className="px-4 py-4">{renderActions(reservation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-4 lg:hidden">
            {reservations.map((reservation, index) => (
              <article key={reservation._id} className={`card-elevated animate-fade-in-up stagger-${(index % 4) + 1} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-slate-50">{reservation.customerName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{reservation.customerEmail}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[reservation.status] || statusStyles.pending}`}>{reservation.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="glass-subtle rounded-2xl p-3"><p className="text-xs text-slate-500 dark:text-slate-400">Table</p><p className="font-semibold text-slate-900 dark:text-slate-50">T{reservation.table?.tableNumber}</p></div>
                  <div className="glass-subtle rounded-2xl p-3"><p className="text-xs text-slate-500 dark:text-slate-400">Date</p><p className="font-semibold text-slate-900 dark:text-slate-50">{formatDate(reservation.reservationDate)}</p></div>
                  <div className="glass-subtle rounded-2xl p-3"><p className="text-xs text-slate-500 dark:text-slate-400">Time</p><p className="font-semibold text-slate-900 dark:text-slate-50">{reservation.reservationTime}</p></div>
                  <div className="glass-subtle rounded-2xl p-3"><p className="text-xs text-slate-500 dark:text-slate-400">Guests</p><p className="font-semibold text-slate-900 dark:text-slate-50">{reservation.numberOfGuests}</p></div>
                </div>
                <div className="mt-4">{renderActions(reservation)}</div>
              </article>
            ))}
          </section>
        </>
      )}

      {selectedReservation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Reservation Details</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedReservation.customerName}</p>
              </div>
              <button onClick={() => setSelectedReservation(null)} className="glass-pill rounded-full p-2 text-slate-700 dark:text-slate-200">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="rounded-[1.5rem] bg-white/25 p-4 dark:bg-slate-900/20">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{selectedReservation.customerEmail}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{selectedReservation.customerPhone || "No phone"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Table</p><p className="font-semibold text-slate-900 dark:text-slate-50">Table {selectedReservation.table?.tableNumber} (Cap {selectedReservation.table?.capacity})</p></div>
                <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Status</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[selectedReservation.status] || statusStyles.pending}`}>{selectedReservation.status}</span></div>
                <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Date</p><p className="font-semibold text-slate-900 dark:text-slate-50">{formatDate(selectedReservation.reservationDate)}</p></div>
                <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Time</p><p className="font-semibold text-slate-900 dark:text-slate-50">{selectedReservation.reservationTime}</p></div>
                <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Guests</p><p className="font-semibold text-slate-900 dark:text-slate-50">{selectedReservation.numberOfGuests}</p></div>
                <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Occasion</p><p className="font-semibold capitalize text-slate-900 dark:text-slate-50">{selectedReservation.occasion || "Standard"}</p></div>
              </div>
              {selectedReservation.specialRequests ? <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Special Requests</p><p className="mt-2 text-slate-700 dark:text-slate-200">{selectedReservation.specialRequests}</p></div> : null}
              {selectedReservation.checkinTime ? <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Check-in Time</p><p className="font-semibold text-slate-900 dark:text-slate-50">{new Date(selectedReservation.checkinTime).toLocaleString()}</p></div> : null}
              {selectedReservation.checkoutTime ? <div className="glass-subtle rounded-2xl p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Check-out Time</p><p className="font-semibold text-slate-900 dark:text-slate-50">{new Date(selectedReservation.checkoutTime).toLocaleString()}</p></div> : null}
              <button onClick={() => setSelectedReservation(null)} className="btn-secondary w-full">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminReservationManager;

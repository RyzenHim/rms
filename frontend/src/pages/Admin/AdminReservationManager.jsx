import React, { useState, useEffect } from "react";
import axios from "axios";

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
  }, [filters]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = { date: filters.date };
      if (filters.status !== "all") params.status = filters.status;

      const response = await axios.get("/api/reservations", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

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
      const response = await axios.get("/api/reservations/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      const response = await axios.patch(
        `/api/reservations/${reservationId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReservations(
        reservations.map((r) =>
          r._id === reservationId ? response.data.reservation : r
        )
      );
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update reservation");
    }
  };

  const handleCheckIn = async (reservationId) => {
    try {
      const response = await axios.patch(
        `/api/reservations/${reservationId}/checkin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReservations(
        reservations.map((r) =>
          r._id === reservationId ? response.data.reservation : r
        )
      );
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (reservationId) => {
    try {
      const response = await axios.patch(
        `/api/reservations/${reservationId}/checkout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReservations(
        reservations.map((r) =>
          r._id === reservationId ? response.data.reservation : r
        )
      );
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to check out");
    }
  };

  const handleNoShow = async (reservationId) => {
    if (!window.confirm("Mark this reservation as no-show?")) return;

    try {
      const response = await axios.patch(
        `/api/reservations/${reservationId}/no-show`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReservations(
        reservations.map((r) =>
          r._id === reservationId ? response.data.reservation : r
        )
      );
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as no-show");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      arrived: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      "no-show": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Reservation Management</h1>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Today's</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.todayReservations}</p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Guests</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalGuests}</p>
          </div>
          <div className="bg-orange-50 border-l-4 border-orange-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Arrived</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.arrivedToday}</p>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-600 p-2 sm:p-4 rounded">
            <p className="text-gray-600 text-xs sm:text-sm font-semibold">Completed</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.completedThisMonth}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
            >
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
      </div>

      {/* Reservations Display */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-600 text-base">No reservations found for the selected date</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Occasion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr
                    key={reservation._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {reservation.customerName}
                        </p>
                        <p className="text-xs text-gray-600">{reservation.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">
                        {reservation.table?.tableNumber}
                      </p>
                      <p className="text-xs text-gray-600">
                        Cap: {reservation.table?.capacity}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(reservation.reservationDate)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {reservation.reservationTime}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {reservation.numberOfGuests}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          reservation.status
                        )}`}
                      >
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">
                      {reservation.occasion}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {reservation.status === "confirmed" && (
                          <button
                            onClick={() => handleCheckIn(reservation._id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                          >
                            Check-In
                          </button>
                        )}
                        {reservation.status === "arrived" && (
                          <button
                            onClick={() => handleCheckOut(reservation._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                          >
                            Check-Out
                          </button>
                        )}
                        {["confirmed", "arrived"].includes(reservation.status) && (
                          <button
                            onClick={() => handleNoShow(reservation._id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                          >
                            No-Show
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden grid grid-cols-1 gap-3 sm:gap-4">
            {reservations.map((reservation) => (
              <div
                key={reservation._id}
                className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {reservation.customerName}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">{reservation.customerEmail}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusColor(
                      reservation.status
                    )}`}
                  >
                    {reservation.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Table</p>
                    <p className="font-semibold text-gray-900">T{reservation.table?.tableNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(reservation.reservationDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time</p>
                    <p className="font-semibold text-gray-900">{reservation.reservationTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Guests</p>
                    <p className="font-semibold text-gray-900">{reservation.numberOfGuests}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-2">
                  {reservation.status === "confirmed" && (
                    <button
                      onClick={() => handleCheckIn(reservation._id)}
                      className="flex-1 min-w-20 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded transition"
                    >
                      Check-In
                    </button>
                  )}
                  {reservation.status === "arrived" && (
                    <button
                      onClick={() => handleCheckOut(reservation._id)}
                      className="flex-1 min-w-20 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded transition"
                    >
                      Check-Out
                    </button>
                  )}
                  {["confirmed", "arrived"].includes(reservation.status) && (
                    <button
                      onClick={() => handleNoShow(reservation._id)}
                      className="flex-1 min-w-20 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded transition"
                    >
                      No-Show
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedReservation(reservation)}
                    className="flex-1 min-w-20 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-1.5 rounded transition"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Details Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Reservation Details</h2>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-semibold text-gray-700">Customer</label>
                <p className="text-gray-600 truncate">{selectedReservation.customerName}</p>
                <p className="text-gray-600 truncate">{selectedReservation.customerEmail}</p>
                <p className="text-gray-600">{selectedReservation.customerPhone}</p>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Table</label>
                <p className="text-gray-600">
                  Table {selectedReservation.table?.tableNumber} (Capacity:{" "}
                  {selectedReservation.table?.capacity})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Date</label>
                  <p className="text-gray-600">
                    {formatDate(selectedReservation.reservationDate)}
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Time</label>
                  <p className="text-gray-600">{selectedReservation.reservationTime}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Guests</label>
                  <p className="text-gray-600">{selectedReservation.numberOfGuests}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Status</label>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold block ${getStatusColor(
                      selectedReservation.status
                    )}`}
                  >
                    {selectedReservation.status}
                  </span>
                </div>
              </div>

              {selectedReservation.specialRequests && (
                <div>
                  <label className="font-semibold text-gray-700">Special Requests</label>
                  <p className="text-gray-600">{selectedReservation.specialRequests}</p>
                </div>
              )}

              {selectedReservation.checkinTime && (
                <div>
                  <label className="font-semibold text-gray-700">Check-in Time</label>
                  <p className="text-gray-600">
                    {new Date(selectedReservation.checkinTime).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedReservation.checkoutTime && (
                <div>
                  <label className="font-semibold text-gray-700">Check-out Time</label>
                  <p className="text-gray-600">
                    {new Date(selectedReservation.checkoutTime).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedReservation(null)}
              className="w-full mt-4 sm:mt-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservationManager;

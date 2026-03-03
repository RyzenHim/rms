import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CustomerReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await axios.get("/api/reservations/my-reservations", {
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

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;

    try {
      await axios.patch(
        `/api/reservations/${selectedReservation._id}/cancel`,
        { reason: cancellationReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReservations(
        reservations.map((r) =>
          r._id === selectedReservation._id ? { ...r, status: "cancelled" } : r
        )
      );
      setShowCancelModal(false);
      setSelectedReservation(null);
      setCancellationReason("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel reservation");
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
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canCancel = (status) => ["pending", "confirmed"].includes(status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
          <button
            onClick={() => navigate("/customer/reservation-form")}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Book New Table
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "arrived", "completed", "cancelled"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? "bg-orange-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-orange-600"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">No reservations found</p>
            <button
              onClick={() => navigate("/customer/reservation-form")}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Book Your First Table
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {reservations.map((reservation) => (
              <div
                key={reservation._id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reservation Details */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Table {reservation.table?.tableNumber}
                        </h2>
                        <p className="text-gray-600">
                          {reservation.table?.location && 
                            `${reservation.table.location.charAt(0).toUpperCase() + reservation.table.location.slice(1)} Location`}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(reservation.status)}`}>
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(reservation.reservationDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium text-gray-900">
                          {reservation.reservationTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guests:</span>
                        <span className="font-medium text-gray-900">
                          {reservation.numberOfGuests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Occasion:</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {reservation.occasion}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Table Capacity:</span>
                        <span className="font-medium text-gray-900">
                          {reservation.table?.capacity} guests
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div>
                    {reservation.specialRequests && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Special Requests</h3>
                        <p className="text-gray-600 text-sm">
                          {reservation.specialRequests}
                        </p>
                      </div>
                    )}

                    {reservation.checkinTime && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Check-in Time</h3>
                        <p className="text-gray-600 text-sm">
                          {new Date(reservation.checkinTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}

                    {reservation.checkoutTime && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Check-out Time</h3>
                        <p className="text-gray-600 text-sm">
                          {new Date(reservation.checkoutTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}

                    {reservation.cancellationReason && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Cancellation Reason</h3>
                        <p className="text-gray-600 text-sm">
                          {reservation.cancellationReason}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {canCancel(reservation.status) && (
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowCancelModal(true);
                        }}
                        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cancel Reservation</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel your reservation for Table{" "}
              {selectedReservation?.table?.tableNumber} on{" "}
              {formatDate(selectedReservation?.reservationDate)}?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please let us know why you're cancelling..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedReservation(null);
                  setCancellationReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancelReservation}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReservations;

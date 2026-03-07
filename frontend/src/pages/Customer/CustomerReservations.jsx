import React, { useState, useEffect } from "react";
import api, { withAuth } from "../../services/api";
import { ReservationFormContent } from "./ReservationForm";

const CustomerReservations = () => {
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
      const response = await api.get("/reservations/my-reservations", {
        params,
        ...withAuth(token),
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
      await api.patch(
        `/reservations/${selectedReservation._id}/cancel`,
        { reason: cancellationReason },
        withAuth(token)
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
    <div className="min-h-screen py-6 sm:py-8 px-3 sm:px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 lg:gap-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
              Book a Table & My Reservations
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Choose your date, time and guests, then manage all your upcoming visits in one place.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)] items-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-[#27374D]">
            <ReservationFormContent />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-soft dark:border-slate-700 dark:bg-[#27374D] max-h-[calc(100vh-9rem)] overflow-y-auto">
            {error && (
              <div className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs sm:text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="mb-3 flex flex-wrap gap-2">
              {["all", "pending", "confirmed", "arrived", "completed", "cancelled"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                      statusFilter === status
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-emerald-500 dark:bg-[#1a2332] dark:text-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-b-emerald-600" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-[#1a2332] dark:text-slate-200">
                You don't have any reservations yet. Use the form on the left to book your first table.
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <article
                    key={reservation._id}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-xs sm:text-sm shadow-soft hover-lift dark:border-slate-600 dark:bg-[#1a2332]"
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50">
                              Table {reservation.table?.tableNumber}
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                              {reservation.table?.location &&
                                `${reservation.table.location.charAt(0).toUpperCase() + reservation.table.location.slice(1)} location • Capacity ${reservation.table?.capacity} guests`}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusColor(
                              reservation.status
                            )}`}
                          >
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </span>
                        </div>

                        <dl className="space-y-1.5 text-[11px] sm:text-xs">
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-500 dark:text-slate-300">Date</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-50">
                              {formatDate(reservation.reservationDate)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-500 dark:text-slate-300">Time</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-50">
                              {reservation.reservationTime}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-500 dark:text-slate-300">Guests</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-50">
                              {reservation.numberOfGuests}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-500 dark:text-slate-300">Occasion</dt>
                            <dd className="font-medium capitalize text-slate-900 dark:text-slate-50">
                              {reservation.occasion}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="space-y-2">
                        {reservation.specialRequests && (
                          <div>
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                              Special Requests
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              {reservation.specialRequests}
                            </p>
                          </div>
                        )}

                        {reservation.checkinTime && (
                          <div>
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                              Check-in Time
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              {new Date(reservation.checkinTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}

                        {reservation.checkoutTime && (
                          <div>
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                              Check-out Time
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              {new Date(reservation.checkoutTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}

                        {reservation.cancellationReason && (
                          <div>
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                              Cancellation Reason
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              {reservation.cancellationReason}
                            </p>
                          </div>
                        )}

                        {canCancel(reservation.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setShowCancelModal(true);
                            }}
                            className="mt-2 w-full rounded-lg bg-red-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-red-700"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#27374D] rounded-lg shadow-lg p-5 sm:p-6 max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">
              Cancel Reservation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200 mb-3">
              Are you sure you want to cancel your reservation for Table{" "}
              {selectedReservation?.table?.tableNumber} on{" "}
              {formatDate(selectedReservation?.reservationDate)}?
            </p>

            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please let us know why you're cancelling..."
                rows="3"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-transparent dark:border-slate-600 dark:bg-[#1a2332] dark:text-slate-50"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedReservation(null);
                  setCancellationReason("");
                }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-[#1a2332]"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancelReservation}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-red-700"
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

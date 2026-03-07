import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { withAuth } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const occasions = [
  { value: "casual", label: "Casual Dining" },
  { value: "birthday", label: "Birthday Celebration" },
  { value: "anniversary", label: "Anniversary" },
  { value: "business", label: "Business Meeting" },
  { value: "celebration", label: "Special Celebration" },
  { value: "other", label: "Other" },
];

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export const ReservationFormContent = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    reservationDate: "",
    reservationTime: "18:00",
    numberOfGuests: 2,
    occasion: "casual",
    specialRequests: "",
    customerPhone: "",
    checkoutTime: "",
  });

  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "numberOfGuests" ? parseInt(value, 10) : value,
    });
  };

  const checkAvailability = async () => {
    if (!formData.reservationDate || !formData.numberOfGuests) {
      setError("Please select date and number of guests");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/tables/available", {
        params: {
          date: formData.reservationDate,
          time: formData.reservationTime,
          guests: formData.numberOfGuests,
        },
      });

      setAvailableTables(response.data.availableTables || []);
      setSelectedTable(null);
      setError("");

      if (response.data.availableTables.length === 0) {
        setError("No tables available for this date, time, and guest count");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check availability");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!String(formData.customerPhone || "").trim()) {
      setError("Please enter a contact phone number");
      return;
    }

    if (!selectedTable) {
      setError("Please select a table");
      return;
    }

    if (!formData.checkoutTime) {
      setError("Please select a checkout time (max 3 hours).");
      return;
    }

    // Enforce max 3 hours between reservation time and checkout time
    try {
      const start = new Date(formData.reservationDate);
      const [sh, sm] = String(formData.reservationTime || "00:00").split(":").map(Number);
      start.setHours(sh || 0, sm || 0, 0, 0);

      const end = new Date(formData.reservationDate);
      const [eh, em] = String(formData.checkoutTime || "00:00").split(":").map(Number);
      end.setHours(eh || 0, em || 0, 0, 0);

      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffMs <= 0) {
        setError("Checkout time must be after reservation time.");
        return;
      }
      if (diffHours > 3) {
        setError("Reservation cannot be longer than 3 hours.");
        return;
      }
    } catch {
      setError("Invalid time selection. Please re-enter reservation and checkout times.");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/reservations",
        {
          tableId: selectedTable._id,
          numberOfGuests: formData.numberOfGuests,
          reservationDate: formData.reservationDate,
          reservationTime: formData.reservationTime,
          occasion: formData.occasion,
          specialRequests: formData.specialRequests,
          customerPhone: formData.customerPhone,
          checkoutTime: formData.checkoutTime,
        },
        withAuth(token)
      );

      setSuccess("Reservation created successfully!");
      setError("");
      setTimeout(() => {
        navigate("/customer/my-reservations");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create reservation");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4 sm:mb-5">
        Book a Table
      </h2>

      {error && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-3.5 rounded-lg border text-xs sm:text-sm bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-3.5 rounded-lg border text-xs sm:text-sm bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Reservation Date*
            </label>
            <input
              type="date"
              name="reservationDate"
              value={formData.reservationDate}
              onChange={handleInputChange}
              min={getTodayDate()}
              className="input-base h-10 sm:h-11 text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Reservation Time*
            </label>
            <input
              type="time"
              name="reservationTime"
              value={formData.reservationTime}
              onChange={handleInputChange}
              className="input-base h-10 sm:h-11 text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Number of Guests*
            </label>
            <select
              name="numberOfGuests"
              value={formData.numberOfGuests}
              onChange={handleInputChange}
              className="input-base h-10 sm:h-11 text-xs sm:text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "Guest" : "Guests"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Occasion
            </label>
            <select
              name="occasion"
              value={formData.occasion}
              onChange={handleInputChange}
              className="input-base h-10 sm:h-11 text-xs sm:text-sm"
            >
              {occasions.map((occ) => (
                <option key={occ.value} value={occ.value}>
                  {occ.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Contact Phone*
          </label>
          <input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleInputChange}
            placeholder="e.g., 9876543210"
            className="input-base h-10 sm:h-11 text-xs sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Checkout Time* (max 3 hours)
          </label>
          <input
            type="time"
            name="checkoutTime"
            value={formData.checkoutTime}
            onChange={handleInputChange}
            className="input-base h-10 sm:h-11 text-xs sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Special Requests
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleInputChange}
            placeholder="Any special requests? (e.g., high chair, wheelchair accessible, quiet corner)"
            rows="3"
            className="input-base min-h-[72px] text-xs sm:text-sm resize-y"
          />
        </div>

        <button
          type="button"
          onClick={checkAvailability}
          disabled={loading}
          className="btn-secondary w-full text-xs sm:text-sm py-2.5 sm:py-3"
        >
          {loading ? "Checking availability..." : "Check Table Availability"}
        </button>

        {availableTables.length > 0 && (
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              Select a Table*
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableTables.map((table) => (
                <button
                  key={table._id}
                  type="button"
                  onClick={() => setSelectedTable(table)}
                  className={`text-left rounded-xl border-2 p-3 sm:p-3.5 text-xs sm:text-sm transition-all ${
                    selectedTable?._id === table._id
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10"
                      : "border-slate-200 hover:border-emerald-500 bg-white dark:bg-[#27374D]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        Table {table.tableNumber}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Capacity: {table.capacity} guests
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                        Location: {table.location}
                      </p>
                    </div>
                    {selectedTable?._id === table._id && (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedTable}
          className="btn-primary w-full text-xs sm:text-sm py-2.5 sm:py-3 disabled:opacity-60"
        >
          {loading ? "Processing..." : "Confirm Reservation"}
        </button>

        <p className="pt-2 text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-300">
          Already have a reservation?{" "}
          <button
            type="button"
            onClick={() => navigate("/customer/my-reservations")}
            className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            View My Reservations
          </button>
        </p>
      </form>
    </div>
  );
};

const ReservationForm = () => (
  <div className="min-h-screen py-6 sm:py-10 px-3 sm:px-4">
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-7 shadow-soft dark:border-slate-700 dark:bg-[#27374D]">
      <ReservationFormContent />
    </div>
  </div>
);

export default ReservationForm;

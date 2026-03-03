import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ReservationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reservationDate: "",
    reservationTime: "18:00",
    numberOfGuests: 2,
    occasion: "casual",
    specialRequests: "",
  });

  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const occasions = [
    { value: "casual", label: "Casual Dining" },
    { value: "birthday", label: "Birthday Celebration" },
    { value: "anniversary", label: "Anniversary" },
    { value: "business", label: "Business Meeting" },
    { value: "celebration", label: "Special Celebration" },
    { value: "other", label: "Other" },
  ];

  // Check available tables
  const checkAvailability = async () => {
    if (!formData.reservationDate || !formData.numberOfGuests) {
      setError("Please select date and number of guests");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get("/api/tables/available", {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "numberOfGuests" ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTable) {
      setError("Please select a table");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "/api/reservations",
        {
          tableId: selectedTable._id,
          numberOfGuests: formData.numberOfGuests,
          reservationDate: formData.reservationDate,
          reservationTime: formData.reservationTime,
          occasion: formData.occasion,
          specialRequests: formData.specialRequests,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSuccess("Reservation created successfully!");
      setError("");
      setTimeout(() => {
        navigate("/customer/my-reservations");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create reservation");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Book a Table</h1>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded text-sm sm:text-base">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Date Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Reservation Date*
              </label>
              <input
                type="date"
                name="reservationDate"
                value={formData.reservationDate}
                onChange={handleInputChange}
                min={getTodayDate()}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Reservation Time*
              </label>
              <input
                type="time"
                name="reservationTime"
                value={formData.reservationTime}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* Number of Guests */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Number of Guests*
              </label>
              <select
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            {/* Occasion */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Occasion
              </label>
              <select
                name="occasion"
                value={formData.occasion}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                {occasions.map((occ) => (
                  <option key={occ.value} value={occ.value}>
                    {occ.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Special Requests */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Special Requests
            </label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              placeholder="Any special requests? (e.g., high chair, wheelchair accessible, quiet corner)"
              rows="3"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Check Availability Button */}
          <button
            type="button"
            onClick={checkAvailability}
            disabled={loading}
            className="w-full mb-4 sm:mb-6 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 sm:py-3 px-4 rounded-lg disabled:opacity-50 transition text-sm sm:text-base"
          >
            {loading ? "Checking..." : "Check Table Availability"}
          </button>

          {/* Available Tables */}
          {availableTables.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">
                Select a Table*
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {availableTables.map((table) => (
                  <div
                    key={table._id}
                    onClick={() => setSelectedTable(table)}
                    className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedTable?._id === table._id
                        ? "border-orange-600 bg-orange-50"
                        : "border-gray-300 hover:border-orange-400"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          Table {table.tableNumber}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Capacity: {table.capacity} guests
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          Location: {table.location}
                        </p>
                      </div>
                      {selectedTable?._id === table._id && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedTable}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 rounded-lg disabled:opacity-50 transition text-sm sm:text-base"
          >
            {loading ? "Processing..." : "Confirm Reservation"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs sm:text-sm mt-4 sm:mt-6">
          Already have a reservation?{" "}
          <button
            onClick={() => navigate("/customer/my-reservations")}
            className="text-orange-600 hover:text-orange-700 font-semibold"
          >
            View My Reservations
          </button>
        </p>
      </div>
    </div>
  );
};

export default ReservationForm;

# Fix Reservation 401 Error and Table Status Check

## Task Summary
Fix the 401 Unauthorized error when fetching customer reservations and ensure table status is checked before booking.

## Issues Identified
1. Token key mismatch: `CustomerReservations.jsx` used `localStorage.getItem("token")` but `AuthContext` stores it as `"rms_token"`
2. Need to ensure table status check works for both QR and reservation flows

## Plan

### Step 1: Fix Token Key in CustomerReservations.jsx ✅
- Changed `localStorage.getItem("token")` to use the token from `useAuth` hook

### Step 2: Add Table Status Validation in Backend ✅
- Added validation in `reservation.controller.js` to check table status before creating reservation
- Added validation in `order.controller.js` to check table status before creating dine-in order

### Step 3: Filter Available Tables Properly ✅
- Updated `table.controller.js` to exclude occupied tables from availability check
- Updated `Customer_Menu.jsx` to filter out occupied tables from dine-in selection

## Files Edited
- `frontend/src/pages/Customer/CustomerReservations.jsx` - Fix token retrieval using useAuth hook
- `backend/src/controllers/reservation.controller.js` - Add table status validation
- `backend/src/controllers/table.controller.js` - Filter out occupied tables from availability
- `backend/src/controllers/order.controller.js` - Add table status validation for dine-in orders
- `frontend/src/pages/customer_pages/Customer_Menu.jsx` - Filter occupied tables from dropdown

## Status
- [x] Step 1: Fix CustomerReservations.jsx token retrieval
- [x] Step 2: Add table status validation in backend
- [x] Step 3: Filter available tables properly
- [x] Step 4: Update Customer_Menu.jsx dine-in table list

---

# Waiter Dashboard Improvements

## Issues Identified
1. Waiter could not see all orders - only their own orders
2. Table selection was manual input instead of dropdown
3. UI alignment and design was poor
4. Waiter could not update order status through workflow

## Changes Made

### Backend (order.controller.js)
1. Added "waiter" to `canViewAllOrders` - waiters can now see all orders
2. Extended waiter status permissions - waiters can now: receive, mark ready, serve, cancel orders
3. Added table status update when order created - table becomes "occupied"
4. Added table status update when order served - table becomes "available"
5. Added table status update when order cancelled - table becomes "available"

### Frontend (Waiter_Orders.jsx)
1. Completely redesigned with professional UI
2. Table dropdown from available tables (excludes occupied/maintenance)
3. Active orders section showing kitchen workflow
4. Status buttons to progress orders through workflow
5. Recently served orders section
6. Better visual feedback with status colors
7. Auto-refresh every 10 seconds

## Files Edited
- `backend/src/controllers/order.controller.js` - Backend permissions and table status
- `frontend/src/pages/waiter_pages/Waiter_Orders.jsx` - Complete UI redesign

## Status
- [x] Backend: Allow waiters to see all orders
- [x] Backend: Allow waiters to update order status
- [x] Backend: Update table status on order creation/serving/cancellation
- [x] Frontend: Redesign Waiter Orders page with table dropdown
- [x] Frontend: Show active orders and status workflow


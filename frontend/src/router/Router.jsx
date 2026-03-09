import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Visitor_Layout from "../layouts/visitor_layout/Visitor_Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import RoleHomeRedirect from "../components/routing/RoleHomeRedirect";
import Customer_Main_Layout from "../layouts/customer_layout/Customer_Main_Layout";
import Admin_Main_Layout from "../layouts/admin_layout/Admin_Main_Layout";
import Manager_Main_Layout from "../layouts/manager_layout/Manager_Main_Layout";
import KitchenStaff_Layout from "../layouts/kitchenStaff_layout/KitchenStaff_Layout";
import Cashier_Main_Layout from "../layouts/cashier_layout/Cashier_Main_Layout";
import Waiter_Main_Layout from "../layouts/waiter_layout/Waiter_Main_Layout";

const Visitor_Home = lazy(() => import("../pages/visitor_pages/Visitor_Home"));
const Visitor_Menu = lazy(() => import("../pages/visitor_pages/Visitor_Menu"));
const Login = lazy(() => import("../pages/auth_pages/Login"));
const Signup = lazy(() => import("../pages/auth_pages/Signup"));
const ForgotPassword = lazy(() => import("../pages/auth_pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth_pages/ResetPassword"));
const Customer_Home = lazy(() => import("../pages/customer_pages/Customer_Home"));
const Customer_Menu = lazy(() => import("../pages/customer_pages/Customer_Menu"));
const Customer_Orders = lazy(() => import("../pages/customer_pages/Customer_Orders"));
const RoleDashboard = lazy(() => import("../pages/role_pages/RoleDashboard"));
const RoleSettings = lazy(() => import("../pages/role_pages/RoleSettings"));
const RoleOrders = lazy(() => import("../pages/role_pages/RoleOrders"));
const ManagerDashboard = lazy(() => import("../pages/manager_pages/Manager_Dashboard"));
const CashierDashboard = lazy(() => import("../pages/cashier_pages/Cashier_Dashboard"));
const CashierBilling = lazy(() => import("../pages/cashier_pages/Cashier_Billing"));
const AdminCustomers = lazy(() => import("../pages/admin_pages/AdminCustomers"));
const AdminSettings = lazy(() => import("../pages/admin_pages/AdminSettings"));
const AdminMenuManager = lazy(() => import("../pages/admin_pages/AdminMenuManager"));
const AdminEmployees = lazy(() => import("../pages/admin_pages/AdminEmployees"));
const AdminTableQR = lazy(() => import("../pages/admin_pages/AdminTableQR"));
const AdminTableStatus = lazy(() => import("../pages/admin_pages/AdminTableStatus"));
const AdminAnalytics = lazy(() => import("../pages/admin_pages/AdminAnalytics"));
const AdminInventory = lazy(() => import("../pages/admin_pages/AdminInventory"));
const AdminReservationManager = lazy(() => import("../pages/Admin/AdminReservationManager"));
const AdminTableManager = lazy(() => import("../pages/Admin/AdminTableManager"));
const CustomerReservations = lazy(() => import("../pages/Customer/CustomerReservations"));
const WaiterOrders = lazy(() => import("../pages/waiter_pages/Waiter_Orders"));
const KitchenOrders = lazy(() => import("../pages/kitchen_pages/Kitchen_Orders"));
const ProfilePage = lazy(() => import("../pages/profile_pages/ProfilePage"));

const withLazy = (element) => (
  <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading...</div>}>{element}</Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Visitor_Layout />,
    children: [
      {
        index: true,
        element: withLazy(<Visitor_Home />),
      },
      {
        path: "menu",
        element: withLazy(<Visitor_Menu />),
      },
    ],
  },
  {
    path: "/auth/login",
    element: withLazy(<Login />),
  },
  {
    path: "/auth/signup",
    element: withLazy(<Signup />),
  },
  {
    path: "/auth/forgot-password",
    element: withLazy(<ForgotPassword />),
  },
  {
    path: "/auth/reset-password",
    element: withLazy(<ResetPassword />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <RoleHomeRedirect />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowRoles={["customer"]} />,
    children: [
      {
        path: "/customer",
        element: <Customer_Main_Layout />,
        children: [
          {
            index: true,
            element: <Navigate to="/" replace />,
          },
          {
            path: "home",
            element: <Navigate to="/" replace />,
          },
          {
            path: "menu",
            element: withLazy(<Customer_Menu />),
          },
          {
            path: "orders",
            element: withLazy(<Customer_Orders />),
          },
          {
            path: "my-reservations",
            element: withLazy(<CustomerReservations />),
          },
          {
            path: "profile",
            element: withLazy(<ProfilePage />),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowRoles={["admin"]} />,
    children: [
      {
        path: "/admin",
        element: <Admin_Main_Layout />,
        children: [
          { index: true, element: withLazy(<RoleDashboard roleLabel="Admin" />) },
          { path: "orders", element: withLazy(<RoleOrders roleLabel="Admin" />) },
          { path: "place-order", element: withLazy(<Customer_Menu />) },
          { path: "menu", element: withLazy(<AdminMenuManager />) },
          { path: "tables", element: withLazy(<AdminTableQR />) },
          { path: "table-status", element: withLazy(<AdminTableStatus />) },
          { path: "table-management", element: withLazy(<AdminTableManager />) },
          { path: "reservations", element: withLazy(<AdminReservationManager />) },
          { path: "employees", element: withLazy(<AdminEmployees />) },
          { path: "customers", element: withLazy(<AdminCustomers />) },
          { path: "analytics", element: withLazy(<AdminAnalytics />) },
          { path: "inventory", element: withLazy(<AdminInventory />) },
          { path: "settings", element: withLazy(<AdminSettings />) },
          { path: "profile", element: withLazy(<ProfilePage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowRoles={["manager"]} />,
    children: [
      {
        path: "/manager",
        element: <Manager_Main_Layout />,
        children: [
          { index: true, element: withLazy(<ManagerDashboard />) },
          { path: "orders", element: withLazy(<RoleOrders roleLabel="Manager" />) },
          { path: "table-status", element: withLazy(<AdminTableStatus />) },
          { path: "settings", element: withLazy(<RoleSettings roleLabel="Manager" />) },
          { path: "profile", element: withLazy(<ProfilePage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowRoles={["kitchen"]} />,
    children: [
      {
        path: "/kitchen",
        element: <KitchenStaff_Layout />,
        children: [
          { index: true, element: withLazy(<KitchenOrders />) },
          { path: "settings", element: withLazy(<RoleSettings roleLabel="Kitchen Staff" />) },
          { path: "profile", element: withLazy(<ProfilePage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowRoles={["cashier"]} />,
    children: [
      {
        path: "/cashier",
        element: <Cashier_Main_Layout />,
        children: [
          { index: true, element: withLazy(<CashierDashboard />) },
          { path: "billing", element: withLazy(<CashierBilling />) },
          { path: "orders", element: withLazy(<RoleOrders roleLabel="Cashier" />) },
          { path: "settings", element: withLazy(<RoleSettings roleLabel="Cashier" />) },
          { path: "profile", element: withLazy(<ProfilePage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowRoles={["waiter"]} />,
    children: [
      {
        path: "/waiter",
        element: <Waiter_Main_Layout />,
        children: [
          { index: true, element: withLazy(<WaiterOrders />) },
          { path: "table-status", element: withLazy(<AdminTableStatus />) },
          { path: "settings", element: withLazy(<RoleSettings roleLabel="Waiter" />) },
          { path: "profile", element: withLazy(<ProfilePage />) },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;

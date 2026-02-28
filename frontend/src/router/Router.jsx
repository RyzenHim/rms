import { createBrowserRouter, Navigate } from "react-router-dom";
import Visitor_Layout from "../layouts/visitor_layout/Visitor_Layout";
import Visitor_Home from "../pages/visitor_pages/Visitor_Home";
import Login from "../pages/auth_pages/Login";
import Signup from "../pages/auth_pages/Signup";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import RoleHomeRedirect from "../components/routing/RoleHomeRedirect";
import Customer_Main_Layout from "../layouts/customer_layout/Customer_Main_Layout";
import Customer_Home from "../pages/customer_pages/Customer_Home";
import Admin_Main_Layout from "../layouts/admin_layout/Admin_Main_Layout";
import Manager_Main_Layout from "../layouts/manager_layout/Manager_Main_Layout";
import KitchenStaff_Layout from "../layouts/kitchenStaff_layout/KitchenStaff_Layout";
import Cashier_Main_Layout from "../layouts/cashier_layout/Cashier_Main_Layout";
import Waiter_Main_Layout from "../layouts/waiter_layout/Waiter_Main_Layout";
import RoleDashboard from "../pages/role_pages/RoleDashboard";
import RoleTasks from "../pages/role_pages/RoleTasks";
import RoleSettings from "../pages/role_pages/RoleSettings";
import AdminSettings from "../pages/admin_pages/AdminSettings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Visitor_Layout />,
    children: [
      {
        index: true,
        element: <Visitor_Home />,
      },
    ],
  },
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    path: "/auth/signup",
    element: <Signup />,
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
            element: <Customer_Home />,
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
          { index: true, element: <RoleDashboard roleLabel="Admin" /> },
          { path: "tasks", element: <RoleTasks roleLabel="Admin" /> },
          { path: "settings", element: <AdminSettings /> },
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
          { index: true, element: <RoleDashboard roleLabel="Manager" /> },
          { path: "tasks", element: <RoleTasks roleLabel="Manager" /> },
          { path: "settings", element: <RoleSettings roleLabel="Manager" /> },
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
          { index: true, element: <RoleDashboard roleLabel="Kitchen Staff" /> },
          { path: "tasks", element: <RoleTasks roleLabel="Kitchen Staff" /> },
          { path: "settings", element: <RoleSettings roleLabel="Kitchen Staff" /> },
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
          { index: true, element: <RoleDashboard roleLabel="Cashier" /> },
          { path: "tasks", element: <RoleTasks roleLabel="Cashier" /> },
          { path: "settings", element: <RoleSettings roleLabel="Cashier" /> },
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
          { index: true, element: <RoleDashboard roleLabel="Waiter" /> },
          { path: "tasks", element: <RoleTasks roleLabel="Waiter" /> },
          { path: "settings", element: <RoleSettings roleLabel="Waiter" /> },
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

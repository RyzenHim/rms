import RoleShell from "../shared/RoleShell";

const Admin_Main_Layout = () => {
  // console.log("logges");
  // a = b;
  return (
    <RoleShell
      title="Admin Panel"
      basePath="/admin"
      links={[
        { to: "/admin", label: "Dashboard", end: true },
        { to: "/admin/orders", label: "Orders" },
        { to: "/admin/place-order", label: "Place Order" },
        { to: "/admin/menu", label: "Menu" },
        { to: "/admin/tables", label: "Table QR" },
        { to: "/admin/table-status", label: "Table Status" },
        { to: "/admin/table-management", label: "Table Management" },
        { to: "/admin/reservations", label: "Reservations" },
        { to: "/admin/employees", label: "Employees" },
        { to: "/admin/customers", label: "Customers" },
        { to: "/admin/analytics", label: "Analytics" },
        { to: "/admin/inventory", label: "Inventory" },
        { to: "/admin/settings", label: "Settings" },
        { to: "/admin/profile", label: "Profile" },
      ]}
    />
  );
};

export default Admin_Main_Layout;

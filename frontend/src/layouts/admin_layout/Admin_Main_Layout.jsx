import RoleShell from "../shared/RoleShell";

const Admin_Main_Layout = () => {
  return (
    <RoleShell
      title="Admin Panel"
      basePath="/admin"
      links={[
        { to: "/admin", label: "Dashboard", end: true },
        { to: "/admin/tasks", label: "Tasks" },
        { to: "/admin/orders", label: "Orders" },
        { to: "/admin/menu", label: "Menu" },
        { to: "/admin/tables", label: "Table QR" },
        { to: "/admin/employees", label: "Employees" },
        { to: "/admin/settings", label: "Settings" },
      ]}
    />
  );
};

export default Admin_Main_Layout;

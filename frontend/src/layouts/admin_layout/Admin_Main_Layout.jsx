import RoleShell from "../shared/RoleShell";

const Admin_Main_Layout = () => {
  return (
    <RoleShell
      title="Admin Panel"
      links={[
        { to: "/admin", label: "Dashboard", end: true },
        { to: "/admin/tasks", label: "Tasks" },
        { to: "/admin/settings", label: "Settings" },
      ]}
    />
  );
};

export default Admin_Main_Layout;

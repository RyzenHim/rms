import RoleShell from "../shared/RoleShell";

const Cashier_Main_Layout = () => {
  return (
    <RoleShell
      title="Cashier Panel"
      links={[
        { to: "/cashier", label: "Dashboard", end: true },
        { to: "/cashier/tasks", label: "Tasks" },
        { to: "/cashier/settings", label: "Settings" },
      ]}
    />
  );
};

export default Cashier_Main_Layout;

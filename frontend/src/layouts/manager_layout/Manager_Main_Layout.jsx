import RoleShell from "../shared/RoleShell";

const Manager_Main_Layout = () => {
  return (
    <RoleShell
      title="Manager Panel"
      links={[
        { to: "/manager", label: "Dashboard", end: true },
        { to: "/manager/tasks", label: "Tasks" },
        { to: "/manager/settings", label: "Settings" },
      ]}
    />
  );
};

export default Manager_Main_Layout;

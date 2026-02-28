import RoleShell from "../shared/RoleShell";

const Waiter_Main_Layout = () => {
  return (
    <RoleShell
      title="Waiter Panel"
      links={[
        { to: "/waiter", label: "Dashboard", end: true },
        { to: "/waiter/tasks", label: "Tasks" },
        { to: "/waiter/settings", label: "Settings" },
      ]}
    />
  );
};

export default Waiter_Main_Layout;

import RoleShell from "../shared/RoleShell";

const Waiter_Main_Layout = () => {
  return (
    <RoleShell
      title="Waiter Panel"
      basePath="/waiter"
      links={[
        { to: "/waiter", label: "Orders", end: true },
        { to: "/waiter/tasks", label: "Board" },
        { to: "/waiter/settings", label: "Settings" },
      ]}
    />
  );
};

export default Waiter_Main_Layout;

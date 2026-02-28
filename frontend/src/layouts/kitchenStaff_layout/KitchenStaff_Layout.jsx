import RoleShell from "../shared/RoleShell";

const KitchenStaff_Layout = () => {
  return (
    <RoleShell
      title="Kitchen Staff"
      links={[
        { to: "/kitchen", label: "Dashboard", end: true },
        { to: "/kitchen/tasks", label: "Tasks" },
        { to: "/kitchen/settings", label: "Settings" },
      ]}
    />
  );
};

export default KitchenStaff_Layout;

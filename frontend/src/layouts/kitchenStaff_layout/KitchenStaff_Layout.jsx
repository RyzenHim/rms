import RoleShell from "../shared/RoleShell";

const KitchenStaff_Layout = () => {
  return (
    <RoleShell
      title="Kitchen Staff"
      basePath="/kitchen"
      links={[
        { to: "/kitchen", label: "Orders", end: true },
        { to: "/kitchen/inventory", label: "Inventory" },
        { to: "/kitchen/settings", label: "Settings" },
      ]}
    />
  );
};

export default KitchenStaff_Layout;

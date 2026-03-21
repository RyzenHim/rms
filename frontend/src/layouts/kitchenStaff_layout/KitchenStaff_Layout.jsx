import RoleShell from "../shared/RoleShell";

const KitchenStaff_Layout = () => {
  return (
    <RoleShell
      title="Kitchen Staff"
      basePath="/kitchen"
      links={[
        { to: "/kitchen/orders-home", label: "Orders" },
        { to: "/kitchen/inventory", label: "Inventory" },
        { to: "/kitchen/settings", label: "Settings" },
      ]}
    />
  );
};

export default KitchenStaff_Layout;

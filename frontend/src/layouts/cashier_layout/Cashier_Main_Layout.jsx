import RoleShell from "../shared/RoleShell";

const Cashier_Main_Layout = () => {
  return (
    <RoleShell
      title="Cashier Panel"
      basePath="/cashier"
      links={[
        { to: "/cashier", label: "Dashboard", end: true },
        { to: "/cashier/billing", label: "Billing" },
        { to: "/cashier/orders", label: "Orders" },
        { to: "/cashier/inventory", label: "Inventory" },
        { to: "/cashier/settings", label: "Settings" },
      ]}
    />
  );
};

export default Cashier_Main_Layout;

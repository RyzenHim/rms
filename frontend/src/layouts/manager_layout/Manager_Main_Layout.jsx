import RoleShell from "../shared/RoleShell";

const Manager_Main_Layout = () => {
  return (
    <RoleShell
      title="Manager Panel"
      basePath="/manager"
      links={[
        { to: "/manager", label: "Dashboard", end: true },
        { to: "/manager/orders", label: "Orders" },
        { to: "/manager/table-status", label: "Table Status" },
        { to: "/manager/employees", label: "Employees" },
        { to: "/manager/customers", label: "Customers" },
        { to: "/manager/settings", label: "Settings" },
      ]}
    />
  );
};

export default Manager_Main_Layout;

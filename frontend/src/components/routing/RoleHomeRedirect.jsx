import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RoleHomeRedirect = () => {
  const { user, getPrimaryRole } = useAuth();
  const role = getPrimaryRole(user?.roles);

  const routeByRole = {
    admin: "/admin",
    manager: "/manager",
    kitchen: "/kitchen",
    cashier: "/cashier",
    waiter: "/waiter",
    customer: "/customer",
  };

  return <Navigate to={routeByRole[role] || "/customer"} replace />;
};

export default RoleHomeRedirect;

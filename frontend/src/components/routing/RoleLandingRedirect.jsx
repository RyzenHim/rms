import { Navigate } from "react-router-dom";
import { getStoredRoleSettings } from "../../utils/roleSettings";

const landingOptions = {
  Manager: {
    dashboard: "/manager",
    orders: "/manager/orders",
    "table-status": "/manager/table-status",
  },
  Cashier: {
    dashboard: "/cashier",
    billing: "/cashier/billing",
    orders: "/cashier/orders",
  },
  "Kitchen Staff": {
    orders: "/kitchen",
    inventory: "/kitchen/inventory",
  },
  Waiter: {
    orders: "/waiter",
    "table-status": "/waiter/table-status",
  },
};

const RoleLandingRedirect = ({ roleLabel, fallbackPath }) => {
  const storedSettings = getStoredRoleSettings(roleLabel);
  const defaultLanding = String(storedSettings.defaultLanding || "").trim();
  const roleRoutes = landingOptions[roleLabel] || {};
  const targetPath = roleRoutes[defaultLanding] || fallbackPath;

  return <Navigate to={targetPath} replace />;
};

export default RoleLandingRedirect;

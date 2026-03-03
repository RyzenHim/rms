import { Outlet } from "react-router-dom";
import GlobalHeader from "../../components/GlobalHeader";

const Visitor_Layout = () => {
  return (
    <div className="min-h-screen">
      <GlobalHeader title="Restaurant Menu" />
      <Outlet />
    </div>
  );
};

export default Visitor_Layout;

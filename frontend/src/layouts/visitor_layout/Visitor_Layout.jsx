import { Outlet } from "react-router-dom";

const Visitor_Layout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
};

export default Visitor_Layout;

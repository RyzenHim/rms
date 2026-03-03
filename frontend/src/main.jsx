import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import "./styles/components.css";
import router from "./router/Router.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import SessionExpiredModal from "./components/SessionExpiredModal.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <SessionExpiredModal />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);

import { Outlet, Navigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { FiLogOut } from "react-icons/fi";
import { logoutSeguro } from "../api/api";

export default function AdminLayout() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const location = useLocation();

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/pos" replace state={{ from: location }} />;
  }

  const handleLogout = () => {
    logoutSeguro();
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#000000",
        margin: 0,
        padding: 0,
      }}
    >
      <AdminSidebar />

      <div
        style={{
          flex: 1,
          marginLeft: "260px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* HEADER SUPERIOR */}
        <header
          style={{
            height: "60px",
            backgroundColor: "#050505",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 30px",
            borderBottom: "1px solid rgba(212,175,55,0.2)",
            position: "sticky",
            top: 0,
            zIndex: 1100,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 14px",
              border: "1px solid #D4AF37",
              backgroundColor: "transparent",
              color: "#D4AF37",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
          >
            <FiLogOut />
            Cerrar sesión
          </button>
        </header>

        {/* CONTENIDO */}
        <main
          style={{
            flex: 1,
            padding: "30px",
            backgroundColor: "#000000",
            color: "#ffffff",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

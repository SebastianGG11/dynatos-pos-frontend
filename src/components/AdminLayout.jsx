import { Outlet, Navigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const location = useLocation();

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/pos" replace state={{ from: location }} />;
  }

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      backgroundColor: "#000000", // Negro absoluto de fondo
      margin: 0,
      padding: 0
    }}>
      <AdminSidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: "260px", 
        padding: "30px",
        backgroundColor: "#000000", // Aseguramos que el contenido también sea negro
        minHeight: "100vh",
        color: "#ffffff"
      }}>
        <Outlet />
      </main>
    </div>
  );
}
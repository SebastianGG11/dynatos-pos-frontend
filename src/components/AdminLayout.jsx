import { Outlet, Navigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar"; // 👈 IMPORTANTE: Importamos tu nuevo Sidebar Premium

function getUserSafe() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const user = getUserSafe();
  const location = useLocation();

  // 🔒 SEGURIDAD: Si no es ADMIN, lo mandamos al POS o al Login
  if (!user || user.role !== "ADMIN") {
    // Si quieres ser estricto, mándalo al login:
    // return <Navigate to="/login" replace />;
    
    // Si prefieres mandarlo al POS:
    return <Navigate to="/pos" replace state={{ from: location }} />;
  }

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      backgroundColor: "#f8f9fa" // Un gris muy suave de fondo para que resalte el contenido
    }}>
      
      {/* 1. Aquí insertamos la Barra Lateral Nueva */}
      <AdminSidebar />

      {/* 2. Contenido Principal (Outlet) */}
      <main style={{ 
        flex: 1, 
        marginLeft: "260px", // 👈 OJO: Este margen debe ser igual al ancho del Sidebar
        padding: "30px",     // Espacio interno para que se vea aireado
        width: "calc(100% - 260px)" // Para asegurar que no se desborde horizontalmente
      }}>
        <Outlet />
      </main>
      
    </div>
  );
}
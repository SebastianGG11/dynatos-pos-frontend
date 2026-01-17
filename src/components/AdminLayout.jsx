// src/components/AdminLayout.jsx
import { Link, Outlet, Navigate, useLocation } from "react-router-dom";

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

  // 🔒 Si no es ADMIN, lo mandamos al POS
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/pos" replace state={{ from: location }} />;
  }

  const logout = () => {
    localStorage.clear();
    window.location.assign("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-black text-white p-4">
        <h1 className="text-lg font-semibold mb-6">Dynatos Admin</h1>

        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/admin" className="hover:bg-white/10 px-3 py-2 rounded">
            Dashboard
          </Link>

          <Link to="/admin/productos" className="hover:bg-white/10 px-3 py-2 rounded">
            Productos
          </Link>

          <Link to="/admin/promociones" className="hover:bg-white/10 px-3 py-2 rounded">
            Promociones
          </Link>

          <Link to="/admin/usuarios" className="hover:bg-white/10 px-3 py-2 rounded">
            Cajeros
          </Link>

          <Link to="/admin/ventas" className="hover:bg-white/10 px-3 py-2 rounded">
            Ventas
          </Link>
        </nav>

        <button onClick={logout} className="mt-8 text-sm text-red-300 underline">
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

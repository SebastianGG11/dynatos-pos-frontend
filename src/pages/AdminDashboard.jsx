import { Link, Outlet, Navigate, useLocation } from "react-router-dom";

function getUserSafe() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function AdminDashboard() {
  const user = getUserSafe();
  const location = useLocation();

  // 🔒 Si no es ADMIN, mandarlo al POS (no a /caja, tu ruta es /pos)
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/pos" replace state={{ from: location.pathname }} />;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-60 bg-black text-white p-4">
        <h1 className="text-lg font-semibold mb-6">Dynatos Admin</h1>

        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/admin" className="hover:bg-gray-800 px-3 py-2 rounded">
            Dashboard
          </Link>
          <Link
            to="/admin/productos"
            className="hover:bg-gray-800 px-3 py-2 rounded"
          >
            Productos
          </Link>
          <Link
            to="/admin/usuarios"
            className="hover:bg-gray-800 px-3 py-2 rounded"
          >
            Cajeros
          </Link>
          <Link
            to="/admin/ventas"
            className="hover:bg-gray-800 px-3 py-2 rounded"
          >
            Ventas
          </Link>
        </nav>

        <button onClick={logout} className="mt-8 text-sm text-red-400 underline">
          Cerrar sesión
        </button>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

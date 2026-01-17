// src/pages/AdminHome.jsx
export default function AdminHome() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold">Panel de Administración</h2>
      <p className="text-gray-600 mt-2">
        Bienvenido{user?.full_name ? `, ${user.full_name}` : ""}. Selecciona una opción del menú.
      </p>
    </div>
  );
}

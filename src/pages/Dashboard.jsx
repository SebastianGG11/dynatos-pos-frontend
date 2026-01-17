import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-gray-200">
      
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Dynatos POS</h1>
        <span className="text-sm text-gray-600">
          {user?.username || "Usuario"}
        </span>
      </header>

      {/* Menú */}
      <nav className="bg-gray-100 border-b px-4 py-2 flex gap-2">
        <MenuButton label="Caja" onClick={() => navigate("/caja")} />
        <MenuButton label="Almacén" onClick={() => navigate("/almacen")} />
        <MenuButton label="Cierre" onClick={() => navigate("/cierre")} />
        <MenuButton label="Config" onClick={() => navigate("/config")} />
      </nav>

      {/* Contenido */}
      <main className="p-6">
        <p className="text-gray-600">
          Selecciona una opción del menú.
        </p>
      </main>
    </div>
  );
}

function MenuButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        bg-white
        border
        px-4
        py-1.5
        rounded
        text-sm
        hover:bg-gray-200
      "
    >
      {label}
    </button>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Usamos esto para navegar sin recargar
import api from "../api/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate(); // Hook de navegación

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Petición al backend
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      const { token, user } = res.data;

      // 2. Verificación básica
      if (!token || !user) {
        throw new Error("Credenciales incorrectas o error en servidor");
      }

      // 3. Guardar en navegador
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // 4. Redirección Inteligente
      const role = user.role?.toUpperCase(); // Aseguramos mayúsculas
      
      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (role === "CAJERO" || role === "CASHIER") {
        navigate("/pos", { replace: true });
      } else {
        setError("Tu usuario no tiene un rol asignado válido.");
      }

    } catch (err) {
      console.error("Error Login:", err);
      setError(
        err?.response?.data?.message || 
        "Error al iniciar sesión. Verifica tus datos."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg" onSubmit={onSubmit}>
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Dynatos POS</h1>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Usuario</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresa tu usuario"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Verificando..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}
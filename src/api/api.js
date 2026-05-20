import axios from "axios";

// Solo se eliminan estas claves al cerrar sesión — NUNCA todo el storage
const AUTH_KEYS = ["token", "user"];

// Cierra sesión preservando TODOS los datos de ventas (dynatos_*)
export function logoutSeguro() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  window.location.href = "/login";
}

const api = axios.create({
  baseURL: "https://dynatos-pos-backend-1.onrender.com",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Solo actuar en 401 confirmado — NO en errores de red (Render dormido, timeout, etc.)
    if (err?.response?.status === 401) {
      // Requests con __skipAuthRedirect=true (heartbeat, auto-refresh) no disparan logout
      if (err.config?.__skipAuthRedirect) {
        console.warn("[AUTH] 401 en request background — sesión posiblemente expirada, continuando sin cerrar sesión");
        return Promise.reject(err);
      }
      console.error("[AUTH] 401 detectado — cerrando sesión de forma segura (datos de ventas preservados)");
      logoutSeguro();
    }
    return Promise.reject(err);
  }
);

export default api;

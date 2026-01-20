// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Caja from "./pages/Caja.jsx";

// ✅ Layout real del admin
import AdminLayout from "./components/AdminLayout.jsx";

// ✅ Páginas del admin
import Dashboard from "./pages/Dashboard.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminSales from "./pages/AdminSales.jsx";
import AdminPromotions from "./pages/AdminPromotions.jsx";
import AdminPurchases from "./pages/AdminPurchases.jsx";
import AdminReturns from "./pages/AdminReturns.jsx"; 
import AdminFinancials from "./pages/AdminFinancials.jsx"; // 👈 1. NUEVA IMPORTACIÓN

function getUserSafe() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function Protected({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RoleHome() {
  const user = getUserSafe();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "CAJERO" || user.role === "CASHIER") return <Navigate to="/pos" replace />;

  return <Navigate to="/login" replace />;
}

function RoleGuard({ allow = [], children }) {
  const user = getUserSafe();
  const role = user?.role;

  if (!role) return <Navigate to="/login" replace />;
  if (allow.length === 0) return children;
  if (allow.includes(role)) return children;

  return <RoleHome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Home dinámico */}
        <Route
          path="/"
          element={
            <Protected>
              <RoleHome />
            </Protected>
          }
        />

        {/* POS / CAJA */}
        <Route
          path="/pos"
          element={
            <Protected>
              <RoleGuard allow={["CAJERO", "CASHIER"]}>
                <Caja />
              </RoleGuard>
            </Protected>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <Protected>
              <RoleGuard allow={["ADMIN"]}>
                <AdminLayout />
              </RoleGuard>
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />
          
          <Route path="productos" element={<AdminProducts />} />
          <Route path="compras" element={<AdminPurchases />} />
          <Route path="promociones" element={<AdminPromotions />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="ventas" element={<AdminSales />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="financials" element={<AdminFinancials />} /> {/* 👈 2. NUEVA RUTA */}
          
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
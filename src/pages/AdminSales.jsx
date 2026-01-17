import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // Asegúrate de haber instalado: npm install xlsx

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fechas: Por defecto el día de hoy
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // URL del Backend (Endpoint nuevo que creamos)
  const API_URL = "https://dynatos-pos-backend-1.onrender.com/reports/sales";

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      // Necesitamos el token si tienes seguridad activada (casi seguro que sí)
      // Ajusta esto según cómo guardes tu token (localStorage o Context)
      const token = localStorage.getItem('token'); 
      
      const res = await axios.get(API_URL, {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` } // Enviamos el token
      });
      setSales(res.data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  // 📥 FUNCIÓN MÁGICA DE EXPORTAR A EXCEL
  const exportToExcel = () => {
    const dataToExport = sales.map(sale => ({
      ID: sale.id,
      Fecha: new Date(sale.created_at).toLocaleString(),
      Cajero: sale.cajero,
      Metodo_Pago: sale.payment_method,
      Total: sale.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    XLSX.writeFile(workbook, `Ventas_${startDate}_al_${endDate}.xlsx`);
  };

  return (
    <div style={{ padding: "20px", color: "#333" }}>
      <h2 style={{ borderBottom: "2px solid #333", paddingBottom: "10px", color: "white" }}>💰 Historial de Ventas</h2>

      {/* BARRA DE FILTROS Y BOTONES */}
      <div style={{ 
        display: "flex", gap: "15px", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap",
        background: "#f0f0f0", padding: "15px", borderRadius: "8px" 
      }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Desde:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Hasta:</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        
        <button 
          onClick={fetchSales}
          style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", height: "38px" }}
        >
          🔍 Filtrar
        </button>

        <button 
          onClick={exportToExcel}
          disabled={sales.length === 0}
          style={{ 
            padding: "10px 20px", 
            background: sales.length === 0 ? "#ccc" : "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: "pointer",
            marginLeft: "auto", // Empuja este botón a la derecha
            fontWeight: "bold",
            display: "flex", alignItems: "center", gap: "5px"
          }}
        >
          📥 Descargar Excel
        </button>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div style={{ overflowX: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead>
            <tr style={{ background: "#212529", color: "white", textAlign: "left" }}>
              <th style={{ padding: "15px" }}>ID</th>
              <th style={{ padding: "15px" }}>Fecha y Hora</th>
              <th style={{ padding: "15px" }}>Cajero</th>
              <th style={{ padding: "15px" }}>Método Pago</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: "20px", textAlign: "center" }}>Cargando ventas...</td></tr>
            ) : sales.map((sale) => (
              <tr key={sale.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "12px" }}>#{sale.id}</td>
                <td style={{ padding: "12px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                <td style={{ padding: "12px", fontWeight: "500" }}>{sale.cajero}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ 
                    padding: "4px 8px", borderRadius: "4px", fontSize: "12px",
                    background: sale.payment_method === "EFECTIVO" ? "#d4edda" : "#cce5ff",
                    color: sale.payment_method === "EFECTIVO" ? "#155724" : "#004085"
                  }}>
                    {sale.payment_method || "N/A"}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold", fontSize: "1.1em" }}>
                  ${Number(sale.total).toLocaleString()}
                </td>
              </tr>
            ))}
            {!loading && sales.length === 0 && (
              <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#666" }}>No se encontraron ventas en estas fechas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../api/api";
import { FiPlus, FiTruck, FiCalendar, FiDollarSign, FiFileText } from "react-icons/fi";

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado del formulario de compras
  const [form, setForm] = useState({
    supplier_name: "",
    invoice_number: "",
    total_amount: "",
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const money = (n) => `$${Number(n).toLocaleString("es-CO")}`;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER PREMIUM */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "30px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "2rem", letterSpacing: "3px", fontWeight: "bold" }}>COMPRAS</h1>
          <p style={{ color: "#888", fontSize: "0.9rem", margin: "5px 0 0 0" }}>Registro de Proveedores y Gastos</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          backgroundColor: "#D4AF37", color: "#000", border: "none", padding: "14px 28px",
          borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", 
          gap: "10px", fontSize: "1rem"
        }}>
          <FiPlus size={20} /> REGISTRAR COMPRA
        </button>
      </div>

      {/* FORMULARIO DE REGISTRO (MODAL) */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #D4AF37", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "600px" }}>
            <h3 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "30px", fontSize: "1.5rem" }}>NUEVA COMPRA A PROVEEDOR</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>PROVEEDOR</label>
                <input 
                  placeholder="Nombre de la empresa o persona"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} 
                />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>N° FACTURA</label>
                <input 
                  placeholder="Ej: FAC-1234"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} 
                />
              </div>
              <div>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>MONTO TOTAL</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff" }} 
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ color: "#D4AF37", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>NOTAS / DETALLES</label>
                <textarea 
                  rows="3"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#000", color: "#fff", resize: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "transparent", color: "#888", cursor: "pointer" }}>CANCELAR</button>
              <button style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#D4AF37", color: "#000", fontWeight: "bold", cursor: "pointer" }}>GUARDAR COMPRA</button>
            </div>
          </div>
        </div>
      )}

      {/* LISTADO DE COMPRAS RECIENTES */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>FECHA</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>PROVEEDOR</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222" }}>FACTURA</th>
              <th style={{ padding: "20px", borderBottom: "1px solid #222", textAlign: "right" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "20px" }}><FiCalendar style={{marginRight:'8px'}}/> 15/01/2026</td>
              <td style={{ padding: "20px", fontWeight: "bold" }}>Distribuidora de Licores S.A.</td>
              <td style={{ padding: "20px", color: "#888" }}>INV-9982</td>
              <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>$1.250.000</td>
            </tr>
            {/* Aquí se mapearán las compras reales cuando conectes el backend */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
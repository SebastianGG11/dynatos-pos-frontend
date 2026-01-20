import { useState, useEffect } from "react";
import api from "../api/api";
import { FiPlus, FiTrash2, FiCalendar, FiDollarSign, FiFilter } from "react-icons/fi";

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado del Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "GENERAL", deduct_from_drawer: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchExpenses(); }, [startDate, endDate]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/expenses", { params: { startDate, endDate } });
      setExpenses(res.data);
    } catch (error) { console.error("Error cargando gastos:", error); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return alert("Completa los campos");
    
    setSubmitting(true);
    try {
      await api.post("/expenses", form);
      alert("✅ Gasto registrado correctamente");
      setShowModal(false);
      setForm({ description: "", amount: "", category: "GENERAL", deduct_from_drawer: true }); // Reset
      fetchExpenses(); // Recargar lista
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Error al guardar"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este registro? (Esto no devuelve el dinero a la caja)")) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (error) { alert("Error eliminando"); }
  };

  // Calcular total visible
  const totalPeriodo = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", animation: "fadeIn 0.5s" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ color: "#ff6b6b", margin: 0, fontSize: "2rem", fontFamily: 'serif' }}>GASTOS OPERATIVOS</h1>
          <p style={{ color: "#888", marginTop: "5px" }}>Registro de salidas, pagos y servicios</p>
        </div>
        <div style={{ textAlign: "right" }}>
            <p style={{ color: "#aaa", fontSize: "0.8rem", margin: 0 }}>TOTAL EN GASTOS</p>
            <p style={{ color: "#ff6b6b", fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>${totalPeriodo.toLocaleString()}</p>
        </div>
      </div>

      {/* FILTROS Y BOTÓN AGREGAR */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px", background: "#111", padding: "15px", borderRadius: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#222", border: "1px solid #444", color: "#fff", padding: "10px", borderRadius: "5px" }} />
        <span style={{ color: "#666" }}>a</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#222", border: "1px solid #444", color: "#fff", padding: "10px", borderRadius: "5px" }} />
        <button onClick={fetchExpenses} style={{ background: "transparent", border: "1px solid #666", color: "#ccc", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}><FiFilter /> Filtrar</button>
        
        <button 
          onClick={() => setShowModal(true)} 
          style={{ marginLeft: "auto", background: "#ff6b6b", color: "#fff", border: "none", padding: "10px 25px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <FiPlus size={20} /> REGISTRAR GASTO
        </button>
      </div>

      {/* TABLA DE GASTOS */}
      <div style={{ backgroundColor: "#111", borderRadius: "10px", overflow: "hidden", border: "1px solid #222" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ background: "#1a0505", color: "#ff6b6b", textAlign: "left" }}>
              <th style={{ padding: "15px" }}>FECHA</th>
              <th style={{ padding: "15px" }}>DESCRIPCIÓN</th>
              <th style={{ padding: "15px" }}>CATEGORÍA</th>
              <th style={{ padding: "15px" }}>RESPONSABLE</th>
              <th style={{ padding: "15px", textAlign: "right" }}>MONTO</th>
              <th style={{ padding: "15px", textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{ padding: "30px", textAlign: "center" }}>Cargando...</td></tr> : expenses.length === 0 ? <tr><td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#666" }}>No hay gastos registrados en este periodo.</td></tr> : expenses.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "15px", color: "#888" }}>{new Date(item.created_at).toLocaleString()}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{item.description}</td>
                <td style={{ padding: "15px" }}><span style={{ background: "#333", padding: "3px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>{item.category}</span></td>
                <td style={{ padding: "15px", color: "#aaa" }}>{item.username}</td>
                <td style={{ padding: "15px", textAlign: "right", color: "#ff6b6b", fontWeight: "bold" }}>-${Number(item.amount).toLocaleString()}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "1.2rem" }} title="Eliminar registro"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVO GASTO */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleSubmit} style={{ background: "#1a1a1a", padding: "30px", borderRadius: "15px", width: "90%", maxWidth: "400px", border: "1px solid #333" }}>
            <h2 style={{ color: "#fff", marginTop: 0 }}>Nuevo Gasto</h2>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#aaa", fontSize: "0.9rem" }}>Descripción</label>
              <input type="text" placeholder="Ej: Pago Recibo Luz" autoFocus value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: "100%", padding: "10px", background: "#333", border: "1px solid #555", color: "#fff", borderRadius: "5px", marginTop: "5px" }} required />
            </div>

            <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#aaa", fontSize: "0.9rem" }}>Monto</label>
                <input type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={{ width: "100%", padding: "10px", background: "#333", border: "1px solid #555", color: "#fff", borderRadius: "5px", marginTop: "5px" }} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#aaa", fontSize: "0.9rem" }}>Categoría</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: "100%", padding: "10px", background: "#333", border: "1px solid #555", color: "#fff", borderRadius: "5px", marginTop: "5px" }}>
                  <option value="GENERAL">General</option>
                  <option value="SERVICIOS">Servicios (Luz/Agua)</option>
                  <option value="NOMINA">Nómina / Sueldos</option>
                  <option value="ARRIENDO">Arriendo</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="PROVEEDORES">Pago Proveedores</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "20px", background: "#331100", padding: "10px", borderRadius: "5px", border: "1px solid #552200", display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="checkbox" id="chkDeduct" checked={form.deduct_from_drawer} onChange={e => setForm({...form, deduct_from_drawer: e.target.checked})} style={{ transform: "scale(1.2)" }} />
              <label htmlFor="chkDeduct" style={{ color: "#ffaa80", fontSize: "0.9rem", cursor: "pointer" }}>¿Sacar dinero de la Caja actual?</label>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #555", color: "#ccc", borderRadius: "5px", cursor: "pointer" }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ flex: 1, padding: "10px", background: "#ff6b6b", border: "none", color: "#fff", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                {submitting ? "Guardando..." : "REGISTRAR"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
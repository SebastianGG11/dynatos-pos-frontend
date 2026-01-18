import { useState, useEffect } from "react";
import api from "../api/api"; // ✅ Usamos la instancia centralizada para el token
import * as XLSX from "xlsx";
import { FiSearch, FiDownload, FiPrinter } from "react-icons/fi";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado para la reimpresión de factura
  const [selectedSale, setSelectedSale] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => { fetchSales(); }, [startDate, endDate]); // ✅ Recarga si cambian las fechas

  const fetchSales = async () => {
    setLoading(true);
    try {
      // ✅ Usamos api.get para que el token se envíe automático
      const res = await api.get("/reports/sales", {
        params: { startDate, endDate }
      });
      setSales(res.data || []);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🖨️ Función para recuperar detalles y disparar la tirilla
  const handleRePrint = async (sale) => {
    setIsFetching(true);
    try {
      // ✅ Solicitud limpia al backend
      const res = await api.get(`/sales/${sale.id}`);
      
      // Guardamos la venta con sus productos
      setSelectedSale({ ...sale, items: res.data.items });
      
      // Pequeña espera para que el navegador "dibuje" la factura antes de imprimir
      setTimeout(() => {
        window.print();
        setSelectedSale(null); // Limpiamos para no dejar basura en el DOM
      }, 500);
    } catch (error) {
      if (error.response?.status === 404) {
        alert("⚠️ Error 404: El backend no encuentra el detalle de la venta. Asegúrate de haber actualizado el archivo 'sales.routes.js' y reiniciado el servidor.");
      } else {
        alert("No se pudieron obtener los detalles de esta venta.");
      }
    } finally {
      setIsFetching(false);
    }
  };

  // Lógica de Impuesto (Mantenemos la matemática del 19% pero cambiamos la etiqueta)
  const calculateTax = (total) => {
    const totalNum = Number(total);
    // Si necesitas cambiar el % a 8% (Impoconsumo real), cambia 1.19 por 1.08
    const valorImpuesto = totalNum - (totalNum / 1.19); 
    const baseGravable = totalNum - valorImpuesto;
    return { baseGravable, valorImpuesto };
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* 🧾 SECCIÓN DE IMPRESIÓN (OCULTA EN PANTALLA) */}
      <div id="print-section" style={{ display: "none" }}>
        {selectedSale && (
          <div style={{ width: "80mm", padding: "5mm", color: "#000", fontFamily: 'monospace', backgroundColor: '#fff' }}>
            <center>
              <h2 style={{ margin: 0, fontSize: '16px' }}>DYNATOS</h2>
              <p style={{ margin: 0 }}>MARKET & LICORERÍA</p>
              <p style={{ margin: 0, fontSize: '10px' }}>NIT: 900.XXX.XXX</p>
              <p style={{ fontSize: '10px', marginTop: '5px' }}>REIMPRESIÓN / COPIA</p>
            </center>
            <div style={{ marginTop: '10px', fontSize: '11px' }}>
              <p style={{ margin: 0 }}>FECHA: {new Date(selectedSale.created_at).toLocaleString()}</p>
              <p style={{ margin: 0 }}>CAJERO: {selectedSale.cajero}</p>
              <p style={{ margin: 0 }}>ORDEN: #{selectedSale.id}</p>
            </div>
            <hr style={{ border: '0.5px dashed #000', margin: '5px 0' }} />
            <table style={{ width: '100%', fontSize: '11px' }}>
              <thead>
                <tr>
                  <th align="left">DESC</th>
                  <th align="center">CANT</th>
                  <th align="right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name.substring(0,18)}</td>
                    <td align="center">{item.quantity}</td>
                    <td align="right">${(item.quantity * item.unit_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: '0.5px dashed #000', margin: '5px 0' }} />
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <p style={{ margin: 0 }}>BASE: ${calculateTax(selectedSale.total).baseGravable.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              
              {/* ✅ AQUÍ ESTÁ EL CAMBIO SOLICITADO */}
              <p style={{ margin: 0 }}>IC / IMPOCONSUMO: ${calculateTax(selectedSale.total).valorImpuesto.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              
              <p style={{ fontSize: '16px', margin: '5px 0', fontWeight: 'bold' }}>
                TOTAL: ${Number(selectedSale.total).toLocaleString()}
              </p>
            </div>
            <div style={{ borderTop: '1px solid #000', marginTop: '5px', paddingTop: '5px', fontSize: '10px' }}>
                <p style={{ margin: 0 }}>MÉTODO DE PAGO: {selectedSale.payment_method}</p>
            </div>
            <center style={{ marginTop: '20px', fontSize: '9px' }}>
              *** GRACIAS POR SU COMPRA ***
            </center>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#111", padding: "25px 35px", borderRadius: "15px",
        border: "1px solid #D4AF37", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div>
          <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "1.8rem", letterSpacing: "2px", fontFamily: 'serif' }}>HISTORIAL DE VENTAS</h1>
          <p style={{ color: "#555", fontSize: "0.8rem", margin: "5px 0 0 0" }}>Control de Ingresos y Facturación</p>
        </div>
        <button 
          onClick={() => {
            const ws = XLSX.utils.json_to_sheet(sales);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Ventas");
            XLSX.writeFile(wb, `Reporte_Ventas_Dynatos_${startDate}.xlsx`);
          }}
          style={{ background: "#D4AF37", color: "#000", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
        >
          <FiDownload /> EXPORTAR EXCEL
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #222", alignItems: "flex-end" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 'bold' }}>DESDE</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 'bold' }}>HASTA</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", outline: 'none' }} />
        </div>
        <button onClick={fetchSales} style={{ background: "transparent", color: "#D4AF37", border: "1px solid #D4AF37", padding: "10px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: 'bold' }}>
          <FiSearch /> FILTRAR RESULTADOS
        </button>
      </div>

      {/* TABLA DE VENTAS */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px", fontSize: '0.8rem' }}>FOLIO</th>
              <th style={{ padding: "20px", fontSize: '0.8rem' }}>FECHA Y HORA</th>
              <th style={{ padding: "20px", fontSize: '0.8rem' }}>CAJERO</th>
              <th style={{ padding: "20px", fontSize: '0.8rem' }}>MÉTODO</th>
              <th style={{ padding: "20px", textAlign: "right", fontSize: '0.8rem' }}>TOTAL</th>
              <th style={{ padding: "20px", textAlign: "center", fontSize: '0.8rem' }}>FACTURA</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center", color: "#D4AF37", letterSpacing: '2px' }}>CARGANDO REGISTROS...</td></tr>
            ) : sales.map((sale) => (
              <tr key={sale.id} style={{ borderBottom: "1px solid #222", transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#161616'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                <td style={{ padding: "20px", fontWeight: 'bold' }}>{sale.cajero}</td>
                <td style={{ padding: "20px" }}>
                   <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '5px', border: '1px solid #333', color: '#888' }}>
                      {sale.payment_method}
                   </span>
                </td>
                <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold", fontSize: '1.1rem' }}>
                  ${Number(sale.total).toLocaleString()}
                </td>
                <td style={{ padding: "20px", textAlign: "center" }}>
                  <button 
                    onClick={() => handleRePrint(sale)}
                    disabled={isFetching}
                    style={{ background: "none", border: "none", color: "#D4AF37", cursor: isFetching ? "wait" : "pointer", transition: '0.3s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FiPrinter size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && !loading && (
              <tr><td colSpan="6" style={{ padding: "50px", textAlign: "center", color: "#444" }}>No se encontraron ventas en este rango de fechas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
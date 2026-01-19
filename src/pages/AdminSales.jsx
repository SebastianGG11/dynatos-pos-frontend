import { useState, useEffect } from "react";
import api from "../api/api";
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp, FiRotateCcw, FiPrinter } from "react-icons/fi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Estado para la "Copia" que se va a imprimir
  const [printData, setPrintData] = useState(null);

  useEffect(() => { fetchSales(); }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/sales", { params: { startDate, endDate } });
      setSales(res.data || []);
    } catch (error) { console.error("Error historial:", error); } finally { setLoading(false); }
  };

  const toggleDetails = async (saleId) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      setSaleDetails(null);
      return;
    }
    setExpandedSaleId(saleId);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSaleDetails(res.data);
    } catch (error) {
      alert("No se pudo cargar el detalle.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // 🖨️ FUNCIÓN DE IMPRESIÓN ESPECÍFICA
  const handlePrintCopy = (sale) => {
    setPrintData(sale);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  const calculateTax = (total) => {
    const totalNum = Number(total || 0);
    const valorImpuesto = totalNum - (totalNum / 1.19);
    const baseGravable = totalNum - valorImpuesto;
    return { baseGravable, valorImpuesto };
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>
      
      {/* 🧾 SECCIÓN DE IMPRESIÓN (SOLO VISIBLE PARA LA IMPRESORA) */}
      <div id="print-receipt" style={{ display: "none" }}>
        {printData && (
          <div style={{ width: "80mm", padding: "5mm", color: "#000", fontFamily: 'monospace', fontSize: '12px' }}>
            <center>
              <h2 style={{ margin: 0 }}>DYNATOS</h2>
              <p style={{ margin: 0 }}>MARKET & LICORERÍA</p>
              <p style={{ margin: '5px 0' }}>COPIA DE FACTURA</p>
            </center>
            <hr style={{ border: '0.5px dashed #000' }} />
            <p>ORDEN: #{printData.id}</p>
            <p>FECHA: {new Date(printData.created_at).toLocaleString()}</p>
            <p>CAJERO: {printData.cajero || 'General'}</p>
            <hr style={{ border: '0.5px dashed #000' }} />
            <table style={{ width: '100%' }}>
              <tbody>
                {printData.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.quantity}x {item.name}</td>
                    <td align="right">${(item.quantity * item.unit_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: '0.5px dashed #000' }} />
            <div style={{ textAlign: 'right' }}>
              <p>TOTAL: ${Number(printData.total).toLocaleString()}</p>
            </div>
            <center style={{ marginTop: '20px' }}>-- COPIA ADMINISTRATIVA --</center>
          </div>
        )}
      </div>

      {/* ESTILO PARA OCULTAR TODO EXCEPTO LA TIRILLA AL IMPRIMIR */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-receipt, #print-receipt * { visibility: visible; }
          #print-receipt { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111", padding: "25px 35px", borderRadius: "15px", border: "1px solid #D4AF37", marginBottom: "30px" }}>
        <h1 style={{ color: "#D4AF37", margin: 0, fontSize: "1.8rem", fontFamily: 'serif' }}>HISTORIAL DE VENTAS</h1>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <thead>
            <tr style={{ backgroundColor: "#1a1a1a", color: "#D4AF37", textAlign: "left" }}>
              <th style={{ padding: "20px" }}>FOLIO</th>
              <th style={{ padding: "20px" }}>FECHA</th>
              <th style={{ padding: "20px" }}>TOTAL</th>
              <th style={{ padding: "20px", textAlign: "center" }}>DETALLE</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <>
                <tr key={sale.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                  <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                  <td style={{ padding: "20px", color: "#D4AF37", fontWeight: "bold" }}>${Number(sale.total).toLocaleString()}</td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <button onClick={() => toggleDetails(sale.id)} style={{ background: "none", border: "none", color: "#D4AF37", cursor: "pointer" }}>
                      {expandedSaleId === sale.id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </button>
                  </td>
                </tr>

                {/* DESGLOSE */}
                {expandedSaleId === sale.id && (
                  <tr>
                    <td colSpan="4" style={{ padding: "0", background: "#0a0a0a" }}>
                      <div style={{ padding: "25px", borderBottom: "1px solid #D4AF37" }}>
                        {loadingDetails ? <p>Cargando...</p> : saleDetails && (
                          <div style={{ display: "flex", gap: "30px" }}>
                            <div style={{ flex: 2 }}>
                              <h4 style={{ color: "#fff" }}>Productos Vendidos</h4>
                              <table style={{ width: "100%", fontSize: "0.9rem" }}>
                                <tr style={{ color: "#666", textAlign: 'left' }}>
                                  <th>Cant.</th>
                                  <th>Producto</th>
                                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                                </tr>
                                {saleDetails.items?.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: "8px 0" }}>x{item.quantity}</td>
                                    {/* ✅ CORRECCIÓN: Usamos item.name (asegúrate que el backend devuelva 'name') */}
                                    <td style={{ padding: "8px 0", color: "#eee" }}>{item.name || "Producto sin nombre"}</td>
                                    <td style={{ padding: "8px 0", textAlign: "right" }}>${Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </table>
                            </div>
                            <div style={{ flex: 1, background: "#111", padding: "20px", borderRadius: "10px" }}>
                              <h4 style={{ color: "#D4AF37" }}>Resumen Financiero</h4>
                              <p>Base: ${calculateTax(saleDetails.total).baseGravable.toLocaleString()}</p>
                              <p>IC: ${calculateTax(saleDetails.total).valorImpuesto.toLocaleString()}</p>
                              <h2 style={{ color: '#D4AF37' }}>TOTAL: ${Number(saleDetails.total).toLocaleString()}</h2>
                              
                              <button 
                                onClick={() => handlePrintCopy(saleDetails)}
                                style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#222', color: '#fff', border: '1px solid #444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              >
                                <FiPrinter /> IMPRIMIR COPIA
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
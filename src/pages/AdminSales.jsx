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

  useEffect(() => { fetchSales(); }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/sales", { params: { startDate, endDate } });
      setSales(res.data || []);
    } catch (error) {
      console.error("Error historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = async (saleId) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      setSaleDetails(null);
      return;
    }

    setExpandedSaleId(saleId);
    setLoadingDetails(true);
    setSaleDetails(null);

    try {
      const res = await api.get(`/sales/${saleId}`);
      setSaleDetails(res.data);
    } catch (error) {
      console.error("Error cargando detalles", error);
      alert("No se pudo cargar el detalle. Verifica que el Backend tenga la ruta /sales/:id");
    } finally {
      setLoadingDetails(false);
    }
  };

  const calculateTax = (total) => {
    const totalNum = Number(total || 0);
    const valorImpuesto = totalNum - (totalNum / 1.19);
    const baseGravable = totalNum - valorImpuesto;
    return { baseGravable, valorImpuesto };
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s ease", padding: "20px" }}>

      {/* ===== CSS SOLO PARA IMPRESIÓN ===== */}
      <style>
        {`
        @media print {
          body * {
            visibility: hidden;
          }

          #ticket-print, #ticket-print * {
            visibility: visible;
          }

          #ticket-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 280px;
            font-family: monospace;
            background: #fff;
            color: #000;
            padding: 10px;
          }
        }
        `}
      </style>

      {/* ===== TABLA HISTORIAL (NO SE TOCA) ===== */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <tbody>
            {sales.map((sale) => (
              <>
                <tr key={sale.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "20px", color: "#666" }}>#{sale.id}</td>
                  <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                  <td style={{ padding: "20px" }}>{sale.cajero}</td>
                  <td style={{ padding: "20px" }}>{sale.payment_method}</td>
                  <td style={{ padding: "20px", textAlign: "right", color: "#D4AF37", fontWeight: "bold" }}>
                    ${Number(sale.total).toLocaleString()}
                  </td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <button
                      onClick={() => toggleDetails(sale.id)}
                      style={{ background: "none", border: "none", color: "#D4AF37", cursor: "pointer" }}
                    >
                      {expandedSaleId === sale.id ? <FiChevronUp /> : <FiChevronDown />} Ver
                    </button>
                  </td>
                </tr>

                {expandedSaleId === sale.id && saleDetails && (
                  <tr>
                    <td colSpan="6" style={{ background: "#0a0a0a", padding: "25px" }}>
                      
                      {/* ===== BOTÓN IMPRIMIR ===== */}
                      <button
                        onClick={() => window.print()}
                        style={{
                          padding: "10px",
                          background: "transparent",
                          border: "1px solid #666",
                          color: "#ccc",
                          borderRadius: "5px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <FiPrinter /> IMPRIMIR COPIA
                      </button>

                      {/* ===== TICKET POS (OCULTO) ===== */}
                      <div id="ticket-print">
                        <div style={{ textAlign: "center", marginBottom: "10px" }}>
                          <strong>DYNATOS</strong><br />
                          MARKET & LICORERÍA
                        </div>

                        <div>
                          FECHA: {new Date(saleDetails.sale_date).toLocaleString()}<br />
                          ORDEN: #{saleDetails.id}<br />
                          CAJERO: {saleDetails.cajero}<br />
                          CLIENTE: {saleDetails.customer_name || 'N/A'}
                        </div>

                        <hr />

                        {saleDetails.items.map((item, idx) => (
                          <div key={idx}>
                            {item.quantity} x {item.product_name}<br />
                            ${Number(item.total).toLocaleString()}
                          </div>
                        ))}

                        <hr />

                        <div>
                          BASE: ${calculateTax(saleDetails.total).baseGravable.toLocaleString()}<br />
                          IC / IMPOCONSUMO: ${calculateTax(saleDetails.total).valorImpuesto.toLocaleString()}
                        </div>

                        <strong>
                          TOTAL: ${Number(saleDetails.total).toLocaleString()}
                        </strong>

                        <hr />

                        MÉTODO: {saleDetails.payments?.[0]?.payment_method || 'TRANSFERENCIA / QR'}<br />
                        RECIBIDO: ${Number(saleDetails.total).toLocaleString()}<br />
                        CAMBIO: $0

                        <div style={{ textAlign: "center", marginTop: "10px" }}>
                          *** GRACIAS ***
                        </div>
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

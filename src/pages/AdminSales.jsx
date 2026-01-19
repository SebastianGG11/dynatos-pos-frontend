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

      {/* CSS SOLO PARA IMPRIMIR (NO AFECTA VISTA NORMAL) */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-sale, #print-sale * {
              visibility: visible;
            }
            #print-sale {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>

      {/* TABLA PRINCIPAL */}
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

                {expandedSaleId === sale.id && (
                  <tr>
                    <td colSpan="6" style={{ background: "#0a0a0a" }}>
                      <div id="print-sale" style={{ padding: "25px" }}>

                        {/* PRODUCTOS */}
                        <h4 style={{ color: "#fff", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
                          Productos Vendidos
                        </h4>

                        <table style={{ width: "100%", color: "#ccc" }}>
                          <tbody>
                            {saleDetails?.items?.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid #222" }}>
                                <td>x{item.quantity}</td>
                                <td>{item.product_name}</td> {/* ✅ CORREGIDO */}
                                <td style={{ textAlign: "right", color: "#D4AF37" }}>
                                  ${Number(item.total).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* RESUMEN */}
                        <div style={{ marginTop: "20px", borderTop: "1px solid #333", paddingTop: "10px" }}>
                          <strong style={{ color: "#fff" }}>TOTAL PAGADO: </strong>
                          <span style={{ color: "#D4AF37", fontWeight: "bold" }}>
                            ${Number(saleDetails?.total || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* BOTÓN IMPRIMIR */}
                        <div style={{ marginTop: "20px" }}>
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

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

  const exportPremiumExcel = async () => {
    if (sales.length === 0) { alert("No hay datos"); return; }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dynatos POS';

    const salesByMonth = sales.reduce((acc, sale) => {
      const date = new Date(sale.created_at);
      const monthName = date.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
      const key = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      if (!acc[key]) acc[key] = [];
      acc[key].push(sale);
      return acc;
    }, {});

    for (const [monthName, monthSales] of Object.entries(salesByMonth)) {
      const sheet = workbook.addWorksheet(monthName);
      sheet.columns = [
        { header: 'FOLIO', key: 'id', width: 12 },
        { header: 'FECHA Y HORA', key: 'created_at', width: 25 },
        { header: 'CAJERO', key: 'cajero', width: 25 },
        { header: 'MÉTODO PAGO', key: 'method', width: 20 },
        { header: 'TOTAL VENTA', key: 'total', width: 20 },
      ];
      let totalMes = 0;
      monthSales.forEach(sale => {
        totalMes += Number(sale.total);
        sheet.addRow({
          id: sale.id,
          created_at: new Date(sale.created_at).toLocaleString(),
          cajero: sale.cajero,
          method: sale.payment_method,
          total: Number(sale.total)
        });
      });
      sheet.addRow(['', '', '', 'TOTAL MES:', totalMes]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Dynatos_Black.xlsx`);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>

      {/* CSS SOLO PARA IMPRESIÓN */}
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
              background: #fff;
              color: #000;
              padding: 20px;
            }
          }
        `}
      </style>

      {/* TABLA */}
      <div style={{ backgroundColor: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee" }}>
          <tbody>
            {sales.map((sale) => (
              <>
                <tr key={sale.id}>
                  <td style={{ padding: "20px" }}>#{sale.id}</td>
                  <td style={{ padding: "20px" }}>{new Date(sale.created_at).toLocaleString()}</td>
                  <td style={{ padding: "20px" }}>{sale.cajero}</td>
                  <td style={{ padding: "20px" }}>{sale.payment_method}</td>
                  <td style={{ padding: "20px", color: "#D4AF37" }}>${Number(sale.total).toLocaleString()}</td>
                  <td>
                    <button onClick={() => toggleDetails(sale.id)}>
                      {expandedSaleId === sale.id ? <FiChevronUp /> : <FiChevronDown />} Ver
                    </button>
                  </td>
                </tr>

                {expandedSaleId === sale.id && saleDetails && (
                  <tr>
                    <td colSpan="6">
                      <div id="print-sale">
                        <h3>Productos Vendidos</h3>
                        <table width="100%">
                          <tbody>
                            {saleDetails.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>x{item.quantity}</td>
                                <td>{item.product_name}</td>
                                <td>${Number(item.total).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <h3>TOTAL: ${Number(saleDetails.total).toLocaleString()}</h3>

                        <button onClick={() => window.print()}>
                          <FiPrinter /> IMPRIMIR COPIA
                        </button>
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

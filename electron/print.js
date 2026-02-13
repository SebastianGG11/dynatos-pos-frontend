const { PosPrinter } = require("electron-pos-printer");

async function printTicket(data) {
  try {
    const items = [
      {
        type: "text",
        value: "DYNATOS",
        style: { 
          textAlign: "center", 
          fontWeight: "900", 
          fontSize: "18px",
          fontFamily: "monospace"
        }
      },
      {
        type: "text",
        value: "MARKET & LICORERIA",
        style: { 
          textAlign: "center", 
          fontWeight: "900", 
          fontSize: "11px",
          fontFamily: "monospace"
        }
      },
      {
        type: "text",
        value: "--------------------------------",
        style: { textAlign: "center", fontWeight: "900" }
      },
      {
        type: "text",
        value: `FECHA: ${data.date}`,
        style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
      },
      {
        type: "text",
        value: `FACT: ${data.sale_number || data.id}`,
        style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
      },
      {
        type: "text",
        value: `CAJERO: ${String(data.cajero).toUpperCase()}`,
        style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
      },
      {
        type: "text",
        value: `CLIENTE: ${data.customerName || 'GENERAL'}`,
        style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
      }
    ];

    if (data.customerDoc) {
      items.push({
        type: "text",
        value: `DOC: ${data.customerDoc}`,
        style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
      });
    }

    items.push({
      type: "text",
      value: "--------------------------------",
      style: { textAlign: "center", fontWeight: "900" }
    });

    data.items.forEach(item => {
      const nombre = item.name.length > 50 ? item.name.substring(0, 20) : item.name;
      items.push({
        type: "text",
        value: `${item.qty} x ${nombre}`,
        style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
      });
      items.push({
        type: "text",
        value: `$${(item.qty * item.sale_price).toLocaleString()}`,
        style: { 
          fontSize: "10px", 
          fontWeight: "900", 
          textAlign: "right",
          fontFamily: "monospace"
        }
      });
    });

    items.push({
      type: "text",
      value: "--------------------------------",
      style: { textAlign: "center", fontWeight: "900" }
    });

    items.push({
      type: "text",
      value: `TOTAL: $${Number(data.total).toLocaleString()}`,
      style: { 
        fontWeight: "900", 
        fontSize: "20px", 
        textAlign: "right",
        fontFamily: "monospace"
      }
    });

    items.push({
      type: "text",
      value: "--------------------------------",
      style: { textAlign: "center", fontWeight: "900" }
    });

    items.push({
      type: "text",
      value: `METODO: ${data.method}`,
      style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
    });
    items.push({
      type: "text",
      value: `RECIBIDO: $${Number(data.received).toLocaleString()}`,
      style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
    });
    items.push({
      type: "text",
      value: `CAMBIO: $${Number(data.change).toLocaleString()}`,
      style: { fontSize: "9px", fontWeight: "900", fontFamily: "monospace" }
    });

    items.push({
      type: "text",
      value: "*** GRACIAS ***",
      style: { 
        textAlign: "center", 
        marginTop: "10px", 
        fontSize: "12px", 
        fontWeight: "900",
        fontFamily: "monospace"
      }
    });

    items.push({
      type: "text",
      value: "\n\n\n"
    });

    console.log("🖨 Enviando a impresora XP-58C...");

    await PosPrinter.print(items, {
      preview: false,
      width: "58mm",
      margin: "0 0 0 0",
      copies: 1,
      silent: true,
      printerName: "XP-58C",
      timeOutPerLine: 400
    });

    console.log("✅ Impreso correctamente");
    return { ok: true };
  } catch (error) {
    console.error("❌ Error en print.js:", error);
    return { ok: false, error: error.message };
  }
}

module.exports = { printTicket };

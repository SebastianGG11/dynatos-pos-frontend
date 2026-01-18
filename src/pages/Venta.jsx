import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import { FiShoppingCart, FiUser, FiDollarSign, FiCreditCard, FiCheckSquare, FiSquare } from "react-icons/fi";

export default function Venta({ cashDrawer, onCashClosed }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState([]);
  const [sale, setSale] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [showQRConfirm, setShowQRConfirm] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // --- NUEVOS ESTADOS PARA CLIENTE ---
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");

  const nombreCajero = useMemo(() => {
    let raw = cashDrawer?.user_full_name || localStorage.getItem('user_data') || "";
    let str = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    const matchFull = str.match(/"FULL_NAME":"([^"]+)"/);
    if (matchFull) return matchFull[1];
    if (!str.includes("{") && str.length < 25) return str;
    return "Cajero";
  }, [cashDrawer]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([api.get("/categories"), api.get("/products")]);
      setCategories(catRes.data?.items ?? []);
      setProducts(prodRes.data?.items ?? []);
    } catch { console.error("Error datos"); }
  };

  const filteredProducts = selectedCategory === "ALL" ? products : products.filter(p => p.category_id === selectedCategory);

  const getAvailableStock = (product) => {
    const inCart = cart.find(i => i.id === product?.id)?.qty || 0;
    return Number(product?.current_stock || 0) - inCart;
  };

  const addProduct = (p) => {
    if (getAvailableStock(p) <= 0) return;
    setCart(prev => {
      const found = prev.find(item => item.id === p.id);
      return found ? prev.map(item => item.id === p.id ? { ...item, qty: item.qty + 1 } : item) : [...prev, { ...p, qty: 1 }];
    });
  };

  const increaseQty = (id) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty + 1 } : p));
  const decreaseQty = (id) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0));

  const clearCart = () => { 
    setCart([]); setSale(null); setPreview(null); setCashReceived(""); setReceiptData(null); 
    // Resetear datos cliente
    setIsCustomClient(false); setClientName(""); setClientDoc("");
  };

  useEffect(() => {
    if (cart.length === 0) { setPreview(null); return; }
    const fetchPreview = async () => {
      try {
        const res = await api.post("/sales", { cash_drawer_id: cashDrawer.id, customer_name: "PREVIEW", items: cart.map(i => ({ product_id: i.id, quantity: i.qty })), preview: true });
        setPreview(res.data.sale);
      } catch { setPreview(null); }
    };
    fetchPreview();
  }, [cart, cashDrawer?.id]);

  const total = preview?.total ?? cart.reduce((s, i) => s + (Number(i.sale_price) * i.qty), 0);
  const valorImpuesto = total - (total / 1.19);
  const baseGravable = total - valorImpuesto;

  const finalizeTransaction = (method, received, change) => {
    // Definir nombre final para la impresión
    let finalCustomerName = "CLIENTE GENERAL";
    let finalCustomerDoc = "";

    if (isCustomClient && clientName.trim()) {
      finalCustomerName = clientName.trim();
      finalCustomerDoc = clientDoc.trim();
    }

    setReceiptData({
      id: sale.id,
      date: new Date().toLocaleString(),
      cajero: nombreCajero,
      items: [...cart],
      subtotal: baseGravable,
      impuesto: valorImpuesto,
      total: total,
      method: method,
      received: received,
      change: change,
      // Datos del cliente para la tirilla
      customerName: finalCustomerName,
      customerDoc: finalCustomerDoc
    });
    setTimeout(() => { window.print(); clearCart(); loadAll(); }, 500);
  };

  const createSale = async () => {
    try {
      // Preparamos el nombre que se guardará en BD
      let nameToSend = "CLIENTE GENERAL";
      if (isCustomClient && clientName.trim()) {
        nameToSend = clientName.trim();
        // Si hay documento, lo pegamos al nombre para que quede en el historial (truco para no cambiar BD)
        if (clientDoc.trim()) {
          nameToSend += ` | ${clientDoc.trim()}`;
        }
      }

      const res = await api.post("/sales", { 
        cash_drawer_id: cashDrawer.id, 
        customer_name: nameToSend, // Enviamos el nombre personalizado
        items: cart.map(i => ({ product_id: i.id, quantity: i.qty })) 
      });
      setSale(res.data.sale);
    } catch { alert("Error al registrar venta."); }
  };

  const payCash = async () => {
    const received = Number(cashReceived);
    if (received < total) { alert("Monto insuficiente"); return; }
    try {
      await api.post("/payments/cash", { sale_id: sale.id, amount: total });
      const change = received - total;
      alert(`✅ Venta Exitosa\n\nCambio: $${change.toLocaleString()}`);
      finalizeTransaction("EFECTIVO", received, change);
    } catch { alert("Error procesando pago"); }
  };

  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", { sale_id: sale.id, amount: total, provider: "NEQUI" });
      setShowQRConfirm(false);
      finalizeTransaction("TRANSFERENCIA / QR", total, 0);
    } catch { alert("Error procesando pago QR"); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
      
      {/* 🧾 TIRILLA TÉRMICA */}
      <div id="print-area" style={{ display: "none" }}>
        {receiptData && (
          <div style={{ width: "80mm", padding: "5mm", color: "#000", fontFamily: 'monospace', backgroundColor: '#fff', fontSize: '11px' }}>
            <center>
              <h2 style={{ margin: 0, fontSize: '16px' }}>DYNATOS</h2>
              <p style={{ margin: 0 }}>MARKET & LICORERÍA</p>
              {/* ❌ NIT DE LA TIENDA ELIMINADO */}
            </center>
            <div style={{ marginTop: '10px', marginBottom: '5px' }}>
              <p style={{ margin: 0 }}>FECHA: {receiptData.date}</p>
              <p style={{ margin: 0 }}>ORDEN: #{receiptData.id}</p>
              <p style={{ margin: 0 }}>CAJERO: {String(receiptData.cajero).toUpperCase()}</p>
              
              {/* ✅ DATOS DEL CLIENTE */}
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>CLIENTE: {receiptData.customerName}</p>
              {receiptData.customerDoc && <p style={{ margin: 0 }}>NIT/CC: {receiptData.customerDoc}</p>}
            </div>
            <hr style={{ border: '0.5px dashed #000', margin: '5px 0' }} />
            <table style={{ width: '100%', fontSize: '11px' }}>
              <tbody>
                {receiptData.items.map(i => (
                  <tr key={i.id}>
                    {/* ✅ NOMBRE COMPLETO (SIN SUBSTRING) */}
                    <td style={{ paddingRight: '5px' }}>
                      {i.qty} x {i.name} 
                    </td>
                    <td align="right" style={{ whiteSpace: 'nowrap' }}>${(i.qty * i.sale_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: '0.5px dashed #000', margin: '5px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0 }}>SUBTOTAL: ${receiptData.subtotal.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              <p style={{ margin: 0 }}>IC / IMPOCONSUMO: ${receiptData.impuesto.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              <h2 style={{ margin: '5px 0', fontSize: '16px' }}>TOTAL: ${receiptData.total.toLocaleString()}</h2>
            </div>
            <div style={{ borderTop: '1px solid #000', marginTop: '10px', paddingTop: '5px' }}>
              <p style={{ margin: 0 }}>MÉTODO: {receiptData.method}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>RECIBIDO:</span><span>${receiptData.received.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>CAMBIO:</span><span>${receiptData.change.toLocaleString()}</span>
              </div>
            </div>
            <center style={{ marginTop: '20px', fontSize: '10px' }}>*** GRACIAS POR SU COMPRA ***</center>
          </div>
        )}
      </div>

      <style>{`@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; } }`}</style>

      {/* SIDEBAR */}
      <div style={{ width: "200px", borderRight: "1px solid #D4AF37", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h3 style={{ color: "#D4AF37", fontSize: "0.7rem", marginBottom: "20px" }}>CATEGORÍAS</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <button onClick={() => setSelectedCategory("ALL")} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === "ALL" ? "#000" : "#fff", backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent", fontWeight: "bold", cursor: 'pointer' }}>TODAS</button>
          {categories.map(c => <button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ width: "100%", padding: "10px", marginBottom: "5px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === c.id ? "#000" : "#fff", backgroundColor: selectedCategory === c.id ? "#D4AF37" : "transparent", cursor: 'pointer', fontSize: '0.8rem' }}>{c.name.toUpperCase()}</button>)}
        </div>
        <button onClick={() => setShowCloseCash(true)} style={{ padding: "12px", background: "#f44", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' }}>CERRAR CAJA</button>
      </div>

      {/* PRODUCTOS */}
      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: "#D4AF37", fontFamily: "serif", margin: 0 }}>PRODUCTOS</h1>
          <div style={{ color: '#fff', fontSize: '0.8rem', backgroundColor: '#111', padding: '10px 15px', borderRadius: '8px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <FiUser color="#D4AF37" /> CAJA: {String(nombreCajero).toUpperCase()}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addProduct(p)} disabled={getAvailableStock(p) <= 0} style={{ background: "#111", border: "1px solid #222", padding: "15px", borderRadius: "12px", textAlign: "left", cursor: "pointer", transition: "0.2s" }}>
              <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#fff" }}>{p.name}</div>
              <div style={{ color: "#D4AF37", fontWeight: "bold", marginTop: "5px" }}>${Number(p.sale_price).toLocaleString()}</div>
              <div style={{ fontSize: "0.7rem", color: "#444", marginTop: "8px" }}>STOCK: {getAvailableStock(p)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CARRITO Y PAGO */}
      <div style={{ width: "380px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", backgroundColor: "#111" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #222", color: "#D4AF37", fontWeight: "bold" }}><FiShoppingCart /> COMPRA ACTUAL</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {cart.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "0.9rem", color: "#eee" }}>
              <div style={{ flex: 1 }}>{i.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button onClick={() => decreaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", width: "24px", cursor: 'pointer' }}>-</button>
                <span>{i.qty}</span>
                <button onClick={() => increaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", width: "24px", cursor: 'pointer' }}>+</button>
              </div>
              <div style={{ color: "#D4AF37" }}>${(i.qty * i.sale_price).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px", backgroundColor: "#0a0a0a", borderTop: "2px solid #D4AF37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: '0.8rem' }}><span>BASE GRAVABLE</span><span>${baseGravable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: '0.8rem', marginBottom: '10px' }}><span>IC / IMPOCONSUMO</span><span>${valorImpuesto.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.8rem", fontWeight: "bold", color: "#D4AF37" }}><span>TOTAL</span><span>${total.toLocaleString()}</span></div>
          
          {/* OPCIÓN CLIENTE PERSONALIZADO */}
          {!sale && (
            <div style={{ marginTop: '15px' }}>
              <div 
                onClick={() => setIsCustomClient(!isCustomClient)} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D4AF37', cursor: 'pointer', marginBottom: '10px', fontSize: '0.9rem' }}
              >
                {isCustomClient ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                <span>¿Factura a nombre propio?</span>
              </div>
              
              {isCustomClient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', animation: 'fadeIn 0.3s' }}>
                  <input 
                    type="text" 
                    placeholder="Nombre Cliente *" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '5px' }}
                  />
                  <input 
                    type="text" 
                    placeholder="NIT / CC (Opcional)" 
                    value={clientDoc}
                    onChange={e => setClientDoc(e.target.value)}
                    style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '5px' }}
                  />
                </div>
              )}
            </div>
          )}

          {!sale ? (
            <button onClick={createSale} disabled={cart.length === 0} style={{ width: "100%", padding: "18px", background: "#D4AF37", border: "none", borderRadius: "10px", fontWeight: "bold", marginTop: '5px', cursor: 'pointer' }}>PAGAR AHORA</button>
          ) : (
            <div>
              <input type="number" placeholder="EFECTIVO RECIBIDO" value={cashReceived} onChange={e => setCashReceived(e.target.value)} style={{ width: "100%", padding: "12px", background: "#000", border: "1px solid #D4AF37", color: "#fff", borderRadius: "8px", textAlign: "center", fontSize: "1.4rem", margin: "15px 0", outline: 'none' }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={payCash} style={{ padding: "15px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' }}><FiDollarSign /> EFECTIVO</button>
                <button onClick={() => setShowQRConfirm(true)} style={{ padding: "15px", border: "1px solid #5c5", color: "#5c5", background: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' }}><FiCreditCard /> QR / NEQUI</button>
              </div>
              <button onClick={() => setSale(null)} style={{ width: "100%", marginTop: "15px", color: "#666", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", textDecoration: 'underline' }}>Cancelar Pago</button>
            </div>
          )}
        </div>
      </div>

      {showQRConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "40px", borderRadius: "20px", border: "1px solid #D4AF37", textAlign: "center", maxWidth: '350px' }}>
            <p style={{ color: "#fff", marginBottom: "30px" }}>¿Confirmas el pago?</p>
            <div style={{ display: "flex", gap: "15px" }}>
              <button onClick={() => setShowQRConfirm(false)} style={{ flex: 1, padding: "12px", background: "#222", color: "#888", border: "none", borderRadius: '8px', cursor: 'pointer' }}>NO, VOLVER</button>
              <button onClick={confirmQRPayment} style={{ flex: 1, padding: "12px", background: "#D4AF37", color: "#000", border: "none", borderRadius: '8px', fontWeight: "bold", cursor: 'pointer' }}>SÍ, PAGADO</button>
            </div>
          </div>
        </div>
      )}
      {showCloseCash && <CerrarCaja cashDrawer={cashDrawer} onClosed={() => { setShowCloseCash(false); onCashClosed(); }} />}
    </div>
  );
}
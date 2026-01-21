import { useEffect, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import { FiShoppingCart, FiUser, FiDollarSign, FiCreditCard, FiCheckSquare, FiSquare, FiLogOut } from "react-icons/fi";

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

  // Estados Cliente
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");

  // 1. LÓGICA DE NOMBRE SIMPLIFICADA (DIRECTO DEL LOGIN)
  const [usuarioActual, setUsuarioActual] = useState("Cajero");

  useEffect(() => {
    try {
      // Buscamos el objeto de usuario que guardamos al hacer Login
      const userStored = localStorage.getItem("user");
      if (userStored) {
        const parsed = JSON.parse(userStored);
        // Prioridad: Nombre completo -> Username -> "Cajero"
        setUsuarioActual(parsed.fullname || parsed.username || "Cajero");
      }
    } catch (e) {
      console.error("Error leyendo usuario", e);
    }
    loadAll();
  }, []);

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
    let finalCustomerName = "CLIENTE GENERAL";
    let finalCustomerDoc = "";

    if (isCustomClient && clientName.trim()) {
      finalCustomerName = clientName.trim();
      finalCustomerDoc = clientDoc.trim();
    }

    setReceiptData({
      id: sale.id, 
      // CAMBIO IMPORTANTE: Guardamos el número de venta formateado (FV...)
      sale_number: sale.sale_number, 
      date: new Date().toLocaleString(), 
      cajero: usuarioActual,
      items: [...cart], subtotal: baseGravable, impuesto: valorImpuesto, total: total,
      method, received, change, customerName: finalCustomerName, customerDoc: finalCustomerDoc
    });
    setTimeout(() => { window.print(); clearCart(); loadAll(); }, 500);
  };

  const createSale = async () => {
    try {
      let nameToSend = "CLIENTE GENERAL";
      if (isCustomClient && clientName.trim()) {
        nameToSend = clientName.trim() + (clientDoc.trim() ? ` | ${clientDoc.trim()}` : "");
      }
      const res = await api.post("/sales", { cash_drawer_id: cashDrawer.id, customer_name: nameToSend, items: cart.map(i => ({ product_id: i.id, quantity: i.qty })) });
      setSale(res.data.sale);
    } catch { alert("Error al registrar venta."); }
  };

  const payCash = async () => {
    const received = Number(cashReceived);
    if (received < total) { alert("Monto insuficiente"); return; }
    try {
      await api.post("/payments/cash", { sale_id: sale.id, amount: total });
      finalizeTransaction("EFECTIVO", received, received - total);
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
      
      {/* 🧾 ZONA DE IMPRESIÓN */}
      <div id="print-area" style={{ display: "none" }}>
        {receiptData && (
          <div style={{ width: "80mm", padding: "5mm", fontFamily: 'monospace', backgroundColor: '#fff', fontSize: '11px', color: '#000' }}>
            <center>
              <h2 style={{ margin: 0, fontSize: '16px' }}>DYNATOS</h2>
              <p style={{ margin: 0 }}>MARKET & LICORERÍA</p>
            </center>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: 0 }}>FECHA: {receiptData.date}</p>
              {/* CAMBIO AQUÍ: Mostrar sale_number o id sin el # duplicado */}
              <p style={{ margin: 0 }}>FACTURA: {receiptData.sale_number || receiptData.id}</p>
              <p style={{ margin: 0 }}>CAJERO: {String(receiptData.cajero).toUpperCase()}</p>
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>CLIENTE: {receiptData.customerName}</p>
              {receiptData.customerDoc && <p style={{ margin: 0 }}>NIT/CC: {receiptData.customerDoc}</p>}
            </div>
            <hr style={{ border: '0.5px dashed #000', margin: '5px 0' }} />
            <table style={{ width: '100%' }}><tbody>{receiptData.items.map(i => (<tr key={i.id}><td style={{paddingRight:'5px'}}>{i.qty} x {i.name}</td><td align="right">${(i.qty * i.sale_price).toLocaleString()}</td></tr>))}</tbody></table>
            <hr style={{ border: '0.5px dashed #000' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0 }}>BASE: ${receiptData.subtotal.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
              <p style={{ margin: 0 }}>IC / IMPOCONSUMO: ${receiptData.impuesto.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
              <h2 style={{ margin: '5px 0' }}>TOTAL: ${receiptData.total.toLocaleString()}</h2>
            </div>
            <div style={{ borderTop: '1px solid #000', marginTop: '5px' }}>
              <p>MÉTODO: {receiptData.method}</p>
              <p>RECIBIDO: ${receiptData.received.toLocaleString()}</p>
              <p>CAMBIO: ${receiptData.change.toLocaleString()}</p>
            </div>
            <center style={{ marginTop: '10px' }}>*** GRACIAS ***</center>
          </div>
        )}
      </div>
      <style>{`@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; } }`}</style>

      {/* 1. SIDEBAR IZQUIERDO */}
      <div style={{ width: "200px", borderRight: "1px solid #D4AF37", padding: "20px", display: "flex", flexDirection: "column", background: "#050505" }}>
        <h3 style={{ color: "#D4AF37", fontSize: "0.8rem", marginBottom: "20px", letterSpacing: '1px' }}>CATEGORÍAS</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <button onClick={() => setSelectedCategory("ALL")} style={{ width: "100%", padding: "12px", marginBottom: "8px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === "ALL" ? "#000" : "#fff", backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent", fontWeight: "bold", cursor: 'pointer', textAlign: 'left' }}>TODAS</button>
          {categories.map(c => <button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ width: "100%", padding: "12px", marginBottom: "8px", borderRadius: "8px", border: "1px solid #333", color: selectedCategory === c.id ? "#000" : "#fff", backgroundColor: selectedCategory === c.id ? "#D4AF37" : "transparent", cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}>{c.name.toUpperCase()}</button>)}
        </div>
        
        {/* ✅ ZONA DE USUARIO AL FINAL DEL SIDEBAR */}
        <div style={{ borderTop: "1px solid #333", paddingTop: "20px", marginTop: "10px" }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#fff' }}>
              <div style={{ background: '#222', padding: '10px', borderRadius: '50%' }}><FiUser color="#D4AF37" /></div>
              <div style={{ overflow: 'hidden' }}>
                 <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>Cajero Activo</p>
                 <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {usuarioActual}
                 </p>
              </div>
           </div>
           <button onClick={() => setShowCloseCash(true)} style={{ width: '100%', padding: "12px", background: "#f44", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FiLogOut /> CERRAR TURNO
           </button>
        </div>
      </div>

      {/* 2. PRODUCTOS (LIMPIO ARRIBA) */}
      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        <h1 style={{ color: "#D4AF37", fontFamily: "serif", margin: "0 0 30px 0", borderBottom: '1px solid #222', paddingBottom: '15px' }}>PRODUCTOS</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addProduct(p)} disabled={getAvailableStock(p) <= 0} style={{ background: "#111", border: "1px solid #222", padding: "15px", borderRadius: "12px", textAlign: "left", cursor: "pointer", position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#fff", marginBottom: '5px' }}>{p.name}</div>
              <div style={{ color: "#D4AF37", fontWeight: "bold", fontSize: '1.1rem' }}>${Number(p.sale_price).toLocaleString()}</div>
              <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "5px" }}>Stock: {getAvailableStock(p)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CARRITO */}
      <div style={{ width: "380px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", backgroundColor: "#080808" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #222", color: "#D4AF37", fontWeight: "bold", fontSize: '1.1rem' }}><FiShoppingCart style={{marginRight: '8px', verticalAlign:'bottom'}} /> TICKETE ACTUAL</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {cart.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "0.9rem", color: "#eee" }}>
              <div style={{ flex: 1 }}>{i.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 10px" }}>
                <button onClick={() => decreaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", width: "24px", cursor: 'pointer', borderRadius:'4px' }}>-</button>
                <span>{i.qty}</span>
                <button onClick={() => increaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", width: "24px", cursor: 'pointer', borderRadius:'4px' }}>+</button>
              </div>
              <div style={{ color: "#D4AF37" }}>${(i.qty * i.sale_price).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "25px", backgroundColor: "#000", borderTop: "1px solid #333" }}>
           <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: '0.8rem' }}><span>BASE</span><span>${baseGravable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
           <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: '0.8rem', marginBottom: '15px' }}><span>IC / IMPOCONSUMO</span><span>${valorImpuesto.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
           <div style={{ display: "flex", justifyContent: "space-between", fontSize: "2rem", fontWeight: "bold", color: "#D4AF37", marginBottom: '20px' }}><span>TOTAL</span><span>${total.toLocaleString()}</span></div>

           {/* CHECKBOX CLIENTE */}
           {!sale && (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#111', borderRadius: '8px', border: '1px solid #222' }}>
              <div onClick={() => setIsCustomClient(!isCustomClient)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
                {isCustomClient ? <FiCheckSquare color="#D4AF37" size={20} /> : <FiSquare color="#666" size={20} />}
                <span>Asignar Cliente a Factura</span>
              </div>
              {isCustomClient && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" placeholder="Nombre Completo" value={clientName} onChange={e => setClientName(e.target.value)} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                  <input type="text" placeholder="NIT o Cédula" value={clientDoc} onChange={e => setClientDoc(e.target.value)} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                </div>
              )}
            </div>
           )}

           {!sale ? (
            <button onClick={createSale} disabled={cart.length === 0} style={{ width: "100%", padding: "18px", background: "#D4AF37", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: '1rem', cursor: 'pointer', color: '#000' }}>COBRAR</button>
           ) : (
            <div style={{ animation: 'fadeInUp 0.3s' }}>
              <input type="number" placeholder="EFECTIVO RECIBIDO" value={cashReceived} onChange={e => setCashReceived(e.target.value)} style={{ width: "100%", padding: "15px", background: "#111", border: "2px solid #D4AF37", color: "#fff", borderRadius: "8px", textAlign: "center", fontSize: "1.5rem", marginBottom: "15px", outline: 'none' }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={payCash} style={{ padding: "15px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' }}>EFECTIVO</button>
                <button onClick={() => setShowQRConfirm(true)} style={{ padding: "15px", border: "1px solid #32CD32", color: "#32CD32", background: "none", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' }}>NEQUI / QR</button>
              </div>
              <button onClick={() => setSale(null)} style={{ width: "100%", marginTop: "15px", color: "#666", background: "none", border: "none", cursor: "pointer", textDecoration: 'underline' }}>Cancelar</button>
            </div>
           )}
        </div>
      </div>

      {showQRConfirm && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}><div style={{background:'#111', padding:'30px', border:'1px solid #D4AF37', borderRadius:'15px', textAlign:'center'}}><p style={{color:'#fff', marginBottom:'20px'}}>¿Confirmas que recibiste la transferencia?</p><div style={{display:'flex', gap:'10px'}}><button onClick={()=>setShowQRConfirm(false)} style={{padding:'10px 20px', background:'#333', color:'#fff', border:'none', borderRadius:'5px'}}>Cancelar</button><button onClick={confirmQRPayment} style={{padding:'10px 20px', background:'#D4AF37', border:'none', borderRadius:'5px', fontWeight:'bold'}}>CONFIRMAR</button></div></div></div>}
      {showCloseCash && <CerrarCaja cashDrawer={cashDrawer} onClosed={() => { setShowCloseCash(false); onCashClosed(); }} />}
    </div>
  );
}
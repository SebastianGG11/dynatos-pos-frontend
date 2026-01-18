import { useEffect, useMemo, useState, useRef } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import { FiGrid, FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiCreditCard, FiDollarSign, FiPrinter, FiX } from "react-icons/fi";

export default function Venta({ cashDrawer, onCashClosed }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState([]);
  const [sale, setSale] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [showQRConfirm, setShowQRConfirm] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products")
      ]);
      setCategories(catRes.data?.items ?? []);
      setProducts(prodRes.data?.items ?? []);
    } catch {
      alert("Error cargando productos o categorías");
    }
  };

  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, c.name ?? `Categoría ${c.id}`));
    return map;
  }, [categories]);

  const filteredProducts = selectedCategory === "ALL" 
    ? products 
    : products.filter((p) => p.category_id === selectedCategory);

  const qtyInCartByProductId = useMemo(() => {
    const map = new Map();
    cart.forEach(item => map.set(item.id, item.qty));
    return map;
  }, [cart]);

  const getAvailableStock = (product) => {
    const inCart = qtyInCartByProductId.get(product.id) || 0;
    return Number(product.current_stock) - inCart;
  };

  const addProduct = (product) => {
    if (getAvailableStock(product) <= 0) {
      alert("No hay stock disponible");
      return;
    }
    setCart((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) {
        return prev.map((p) => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const increaseQty = (id) => {
    const prod = products.find(p => p.id === id);
    if (getAvailableStock(prod) <= 0) return;
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty + 1 } : p));
  };

  const decreaseQty = (id) => {
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0));
  };

  const clearCart = () => {
    setCart([]); setSale(null); setPreview(null); setCashReceived("");
  };

  useEffect(() => {
    if (cart.length === 0) { setPreview(null); return; }
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await api.post("/sales", {
          cash_drawer_id: cashDrawer.id,
          customer_name: "PREVIEW",
          customer_document: "0",
          items: cart.map((i) => ({ product_id: i.id, quantity: i.qty })),
          preview: true,
        });
        setPreview(res.data.sale);
      } catch { setPreview(null); } finally { setLoadingPreview(false); }
    };
    fetchPreview();
  }, [cart, cashDrawer.id]);

  const subtotal = cart.reduce((sum, i) => sum + Number(i.sale_price) * i.qty, 0);
  const promoDiscount = preview?.promo_discount_total ?? 0;
  const total = preview?.total ?? subtotal;

  const createSale = async () => {
    if (cart.length === 0) return;
    try {
      const res = await api.post("/sales", {
        cash_drawer_id: cashDrawer.id,
        customer_name: "Cliente mostrador",
        customer_document: "0",
        items: cart.map((i) => ({ product_id: i.id, quantity: i.qty })),
      });
      setSale(res.data.sale);
    } catch { alert("Error creando la venta"); }
  };

  const handlePrint = () => {
    window.print();
    clearCart();
    loadAll();
  };

  const payCash = async () => {
    const received = Number(cashReceived);
    if (Number.isNaN(received) || received < total) {
      alert("Monto inválido");
      return;
    }
    try {
      await api.post("/payments/cash", { sale_id: sale.id, amount: total });
      handlePrint();
    } catch { alert("Error en pago efectivo"); }
  };

  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", { sale_id: sale.id, amount: total, provider: "NEQUI" });
      handlePrint();
    } catch { alert("Error en pago QR"); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#000", color: "#fff" }}>
      
      {/* 🧾 COMPONENTE DE FACTURA (OCULTO EN PANTALLA, SOLO PARA IMPRESIÓN) */}
      <div style={{ display: "none" }}>
        <div id="thermal-receipt" ref={printRef} style={{ width: "80mm", padding: "10px", color: "#000", background: "#fff", fontFamily: "monospace", fontSize: "12px" }}>
          <div style={{ textAlign: "center", fontWeight: "bold" }}>
            <h2 style={{ margin: "0" }}>DYNATOS</h2>
            <p style={{ margin: "0", fontSize: "10px" }}>MARKET & LICORERÍA</p>
            <p style={{ margin: "0", fontSize: "9px" }}>NIT: 123456789-0</p>
          </div>
          <hr style={{ border: "0.5px dashed #000" }} />
          <p style={{ margin: "2px 0" }}>FECHA: {new Date().toLocaleDateString()}</p>
          <p style={{ margin: "2px 0" }}>HORA: {new Date().toLocaleTimeString()}</p>
          <p style={{ margin: "2px 0" }}>CAJERO: {cashDrawer.user_name || "Admin"}</p>
          <hr style={{ border: "0.5px dashed #000" }} />
          <table style={{ width: "100%", fontSize: "11px" }}>
            <thead><tr><th align="left">CANT</th><th align="left">PROD</th><th align="right">TOTAL</th></tr></thead>
            <tbody>
              {cart.map(i => (
                <tr key={i.id}>
                  <td>{i.qty}</td><td>{i.name.substring(0, 15)}</td><td align="right">${(i.qty * i.sale_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr style={{ border: "0.5px dashed #000" }} />
          <div style={{ textAlign: "right", fontWeight: "bold" }}>
            <p style={{ margin: "2px 0" }}>SUBTOTAL: ${subtotal.toLocaleString()}</p>
            {promoDiscount > 0 && <p style={{ margin: "2px 0" }}>DESC. PROMO: -${promoDiscount.toLocaleString()}</p>}
            <p style={{ margin: "2px 0", fontSize: "14px" }}>TOTAL: ${total.toLocaleString()}</p>
          </div>
          <hr style={{ border: "0.5px dashed #000" }} />
          <div style={{ fontSize: "9px", textAlign: "center" }}>
            <p style={{ fontWeight: "bold" }}>RESPONSABLE DE IVA</p>
            <p>AUTORIZACIÓN DIAN: 1876407</p>
            <p>RANGO: 200001 A 500000</p>
          </div>
          <p style={{ fontSize: "8px", textAlign: "justify", marginTop: "10px" }}>
            Apreciado cliente, nos permitimos informarle que por razones de seguridad y salubridad, NO se aceptan cambios en bebidas alcohólicas, cigarrillos, tabacos, medicamentos, productos refrigerados.
          </p>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } #thermal-receipt, #thermal-receipt * { visibility: visible; } #thermal-receipt { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>

      {/* 🗄️ SIDEBAR: CATEGORÍAS */}
      <div style={{ width: "20%", backgroundColor: "#111", borderRight: "1px solid #D4AF37", padding: "20px" }}>
        <h2 style={{ color: "#D4AF37", letterSpacing: "2px", fontSize: "0.9rem", marginBottom: "20px" }}>CATEGORÍAS</h2>
        <button onClick={() => setSelectedCategory("ALL")} style={{ width: "100%", padding: "12px", borderRadius: "10px", marginBottom: "10px", border: selectedCategory === "ALL" ? "1px solid #D4AF37" : "1px solid #333", backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent", color: selectedCategory === "ALL" ? "#000" : "#fff", fontWeight: "bold", transition: "0.3s" }}>TODAS</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ width: "100%", padding: "12px", borderRadius: "10px", marginBottom: "10px", border: selectedCategory === c.id ? "1px solid #D4AF37" : "1px solid #333", backgroundColor: selectedCategory === c.id ? "#D4AF37" : "transparent", color: selectedCategory === c.id ? "#000" : "#fff", fontWeight: "bold", transition: "0.3s" }}>{categoryNameById.get(c.id).toUpperCase()}</button>
        ))}
        <button onClick={() => setShowCloseCash(true)} style={{ marginTop: "40px", width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#f44", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>CERRAR CAJA</button>
      </div>

      {/* 🥃 PRODUCTOS */}
      <div style={{ width: "55%", padding: "30px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#D4AF37", fontSize: "1.8rem", fontFamily: "serif", letterSpacing: "2px" }}>PRODUCTOS</h1>
          <div style={{ color: "#666", fontSize: "0.8rem" }}>TERMINAL: 01 | CAJERO: {cashDrawer.user_name || "Admin"}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
          {filteredProducts.map((p) => (
            <button key={p.id} onClick={() => addProduct(p)} disabled={getAvailableStock(p) <= 0} style={{ backgroundColor: "#111", border: "1px solid #222", padding: "20px", borderRadius: "15px", textAlign: "left", cursor: "pointer", position: "relative", transition: "0.3s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#D4AF37"}>
              <div style={{ fontWeight: "bold", fontSize: "1rem", marginBottom: "5px" }}>{p.name}</div>
              <div style={{ color: "#D4AF37", fontSize: "1.2rem", fontWeight: "bold" }}>${Number(p.sale_price).toLocaleString()}</div>
              <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "10px" }}>STOCK: {getAvailableStock(p)}</div>
              {getAvailableStock(p) <= 0 && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#f44", fontWeight: "bold" }}>AGOTADO</div>}
            </button>
          ))}
        </div>
      </div>

      {/* 🛒 CARRITO / PAGO */}
      <div style={{ width: "25%", backgroundColor: "#111", padding: "25px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column" }}>
        <h2 style={{ color: "#D4AF37", fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}><FiShoppingCart /> CARRITO</h2>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {cart.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid #222" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{i.name}</div>
                <div style={{ color: "#D4AF37", fontSize: "0.8rem" }}>${Number(i.sale_price).toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={() => decreaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: "5px", padding: "5px" }}><FiMinus size={12} /></button>
                <span>{i.qty}</span>
                <button onClick={() => increaseQty(i.id)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: "5px", padding: "5px" }}><FiPlus size={12} /></button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "2px solid #D4AF37", paddingTop: "20px", marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>SUBTOTAL</span><span>${subtotal.toLocaleString()}</span></div>
          {promoDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#5c5" }}><span>DESCUENTO</span><span>-${promoDiscount.toLocaleString()}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: "bold", color: "#D4AF37", marginTop: "10px" }}><span>TOTAL</span><span>${total.toLocaleString()}</span></div>
          <button onClick={clearCart} style={{ width: "100%", padding: "10px", background: "transparent", color: "#f55", border: "1px solid #f55", borderRadius: "8px", marginTop: "15px", cursor: "pointer" }}><FiTrash2 /> LIMPIAR</button>
          
          {!sale ? (
            <button onClick={createSale} disabled={cart.length === 0 || loadingPreview} style={{ width: "100%", padding: "15px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "10px", marginTop: "10px", fontWeight: "bold", cursor: "pointer" }}>REGISTRAR VENTA</button>
          ) : (
            <div style={{ animation: "fadeInUp 0.3s ease" }}>
              <input type="number" placeholder="EFECTIVO RECIBIDO" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} style={{ width: "100%", padding: "15px", background: "#000", border: "1px solid #D4AF37", borderRadius: "8px", color: "#fff", marginTop: "15px", fontSize: "1.2rem", textAlign: "center" }} />
              <button onClick={payCash} style={{ width: "100%", padding: "15px", background: "#D4AF37", color: "#000", borderRadius: "10px", marginTop: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><FiDollarSign /> PAGAR EN EFECTIVO</button>
              <button onClick={() => setShowQRConfirm(true)} style={{ width: "100%", padding: "15px", background: "transparent", color: "#5c5", border: "1px solid #5c5", borderRadius: "10px", marginTop: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><FiCreditCard /> PAGO QR / NEQUI</button>
            </div>
          )}
        </div>
      </div>

      {showQRConfirm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #D4AF37", textAlign: "center" }}>
            <h3 style={{ color: "#D4AF37" }}>¿EL PAGO FUE EXITOSO?</h3>
            <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button onClick={() => setShowQRConfirm(false)} style={{ flex: 1, padding: "12px", background: "transparent", color: "#888", border: "1px solid #333", borderRadius: "10px" }}>NO, CANCELAR</button>
              <button onClick={confirmQRPayment} style={{ flex: 1, padding: "12px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "10px", fontWeight: "bold" }}>SÍ, CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {showCloseCash && (
        <CerrarCaja cashDrawer={cashDrawer} onClosed={() => { setShowCloseCash(false); onCashClosed(); }} />
      )}
    </div>
  );
}
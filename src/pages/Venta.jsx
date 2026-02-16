import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import {
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiCheckSquare,
  FiSquare,
  FiPackage,
  FiX
} from "react-icons/fi";

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

  // ✅ NUEVO: Estados para presentaciones
  const [showPresentationsModal, setShowPresentationsModal] = useState(false);
  const [currentProductPresentations, setCurrentProductPresentations] = useState(null);

  const [isCustomClient, setIsCustomClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");

  const [usuarioActual, setUsuarioActual] = useState("Cajero");

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  const isEditableElement = () => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || el.isContentEditable;
  };

  // ✅ MODIFICADO: Ahora busca presentaciones por código de barras
  const handleBarcodeScan = async (codeRaw) => {
    const code = String(codeRaw || "").trim();
    if (!code) return;

    try {
      // Buscar presentaciones por código de barras
      const res = await api.get(`/presentations/search?q=${code}`);
      const data = res.data;

      if (data.single_presentation) {
        // Solo tiene una presentación, agregar directamente
        addPresentationToCart(
          data.product_id,
          data.product_name,
          data.presentation.id,
          data.presentation.presentation_name,
          data.presentation.quantity,
          data.presentation.sale_price,
          data.base_stock
        );
      } else {
        // Tiene múltiples presentaciones, mostrar modal
        setCurrentProductPresentations(data);
        setShowPresentationsModal(true);
      }
    } catch (error) {
      console.log("🔎 Código no encontrado:", code);
      
      // Fallback: buscar en productos locales (por si no tiene presentaciones)
      const found =
        products.find((p) => String(p.barcode || "").trim() === code) ||
        products.find((p) => String(p.sku || "").trim() === code);

      if (found) {
        addProduct(found);
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Shift" || e.key === "Alt" || e.key === "Control" || e.key === "Meta") return;

      const now = Date.now();
      const delta = now - (lastKeyTimeRef.current || 0);
      lastKeyTimeRef.current = now;

      const typingHuman = isEditableElement() && delta > 80;

      if (e.key === "Enter") {
        const candidate = scanBufferRef.current;
        scanBufferRef.current = "";

        if (candidate && candidate.length >= 4) {
          e.preventDefault();
          handleBarcodeScan(candidate);
        }
        return;
      }

      const isChar = /^[a-zA-Z0-9\-_]$/.test(e.key);
      if (!isChar) {
        if (!typingHuman) scanBufferRef.current = "";
        return;
      }

      if (typingHuman) return;

      if (delta > 120) {
        scanBufferRef.current = e.key;
      } else {
        scanBufferRef.current += e.key;
      }

      if (isEditableElement() && delta <= 80) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [products]);

  useEffect(() => {
    try {
      const userStored = localStorage.getItem("user");
      if (userStored) {
        const parsed = JSON.parse(userStored);
        setUsuarioActual(parsed.fullname || parsed.username || "Cajero");
      }
    } catch (e) {
      console.error("Error leyendo usuario", e);
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products")
      ]);
      setCategories(catRes.data?.items ?? []);
      setProducts(prodRes.data?.items ?? []);
    } catch {
      console.error("Error datos");
    }
  };

  const filteredProducts =
    selectedCategory === "ALL"
      ? products
      : products.filter((p) => p.category_id === selectedCategory);

  const getAvailableStock = (product) => {
    const inCart = cart.find((i) => i.id === product?.id)?.qty || 0;
    return Number(product?.current_stock || 0) - inCart;
  };

  // ✅ NUEVO: Agregar presentación al carrito
  const addPresentationToCart = (productId, productName, presentationId, presentationName, quantity, price, baseStock) => {
    // Verificar stock disponible
    const totalUnitsInCart = cart
      .filter(item => item.product_id === productId)
      .reduce((sum, item) => sum + (item.units_per_item * item.qty), 0);
    
    const availableUnits = baseStock - totalUnitsInCart;
    
    if (availableUnits < quantity) {
      alert(`Stock insuficiente. Disponible: ${availableUnits} unidades`);
      return;
    }

    // Crear un ID único para esta presentación en el carrito
    const cartItemId = `${productId}-${presentationId}`;

    setCart((prev) => {
      const found = prev.find((item) => item.cart_id === cartItemId);
      
      if (found) {
        // Ya existe, aumentar cantidad
        return prev.map((item) =>
          item.cart_id === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        // Agregar nuevo
        return [
          ...prev,
          {
            cart_id: cartItemId,
            product_id: productId,
            presentation_id: presentationId,
            name: `${productName} - ${presentationName}`,
            sale_price: price,
            units_per_item: quantity, // Cuántas unidades base tiene esta presentación
            qty: 1,
            is_presentation: true
          }
        ];
      }
    });

    // Cerrar modal si estaba abierto
    setShowPresentationsModal(false);
    setCurrentProductPresentations(null);
  };

  // Función original para productos sin presentaciones
// ✅ MEJORADO: Buscar presentaciones también al hacer clic
  const addProduct = async (p) => {
    if (getAvailableStock(p) <= 0) return;

  // Intentar buscar presentaciones del producto
    try {
      const res = await api.get(`/presentations/${p.id}/presentations`);
      const presentations = res.data.items || [];

      if (presentations.length === 0) {
      // No tiene presentaciones, agregar normalmente
        setCart((prev) => {
          const found = prev.find((item) => item.id === p.id && !item.is_presentation);
          return found
            ? prev.map((item) =>
              item.id === p.id && !item.is_presentation ? { ...item, qty: item.qty + 1 } : item
             )
            : [...prev, { ...p, qty: 1, is_presentation: false }];
        });
      } else if (presentations.length === 1) {
      // Una sola presentación, agregar directamente
        const pres = presentations[0];
        addPresentationToCart(
         p.id,
         p.name,
          pres.id,
          pres.name,
          pres.quantity,
          pres.sale_price,
          p.current_stock
       );
      } else {
      // Múltiples presentaciones, mostrar modal
        setCurrentProductPresentations({
          product_id: p.id,
          product_name: p.name,
          base_stock: p.current_stock,
          cost_price: p.cost_price,
          image_filename: p.image_filename,
          single_presentation: false,
          presentations: presentations.map(pr => ({
            id: pr.id,
            presentation_name: pr.name,
            quantity: pr.quantity,
            sale_price: pr.sale_price
          }))
        });
       setShowPresentationsModal(true);
      }
    } catch (error) {
     // Error obteniendo presentaciones, agregar como producto normal
     console.log("No se encontraron presentaciones, agregando como producto normal");
     setCart((prev) => {
       const found = prev.find((item) => item.id === p.id && !item.is_presentation);
       return found
         ? prev.map((item) =>
             item.id === p.id && !item.is_presentation ? { ...item, qty: item.qty + 1 } : item
           )
         : [...prev, { ...p, qty: 1, is_presentation: false }];
     });
   }
  };;

  const increaseQty = (cartId) =>
    setCart((prev) =>
      prev.map((p) => (p.cart_id === cartId || p.id === cartId ? { ...p, qty: p.qty + 1 } : p))
    );

  const decreaseQty = (cartId) =>
    setCart((prev) =>
      prev
        .map((p) => (p.cart_id === cartId || p.id === cartId ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    );

  const clearCart = () => {
    setCart([]);
    setSale(null);
    setPreview(null);
    setCashReceived("");
    setIsCustomClient(false);
    setClientName("");
    setClientDoc("");
  };

  useEffect(() => {
    if (!cashDrawer?.id) return;
    if (cart.length === 0) {
      setPreview(null);
      return;
    }
    const totalLocal = cart.reduce(
      (sum, i) => sum + Number(i.sale_price) * i.qty,
      0
    );
    setPreview({ total: totalLocal });
  }, [cart, cashDrawer?.id]);

  const total =
    preview?.total ??
    cart.reduce((s, i) => s + Number(i.sale_price) * i.qty, 0);

  const valorImpuesto = total - total / 1.19;
  const baseGravable = total - valorImpuesto;

  const finalizeTransaction = async (method, received, change) => {
    let finalCustomerName = "CLIENTE GENERAL";
    let finalCustomerDoc = "";

    if (isCustomClient && clientName.trim()) {
      finalCustomerName = clientName.trim();
      finalCustomerDoc = clientDoc.trim();
    }

    const ticket = {
      id: sale.id,
      sale_number: sale.sale_number,
      date: new Date().toLocaleString(),
      cajero: usuarioActual,
      items: cart.map(i => ({
        name: i.name,
        qty: i.qty,
        sale_price: i.sale_price
      })),
      subtotal: baseGravable,
      impuesto: valorImpuesto,
      total: total,
      method,
      received,
      change,
      customerName: finalCustomerName,
      customerDoc: finalCustomerDoc
    };

    try {
      if (isElectron) {
        console.log("🖨 Imprimiendo en Electron...");
        await window.electronAPI.printTicket(ticket);
      } else {
        const ticketHTML = `
          <div style="width:58mm;font-family:monospace;font-size:10px;font-weight:900;padding:2mm;">
            <div style="text-align:center;font-size:18px;">DYNATOS</div>
            <div style="text-align:center;font-size:11px;">MARKET & LICORERIA</div>
            <div style="border-top:2px dashed #000;margin:2mm 0;"></div>
            <div>FECHA: ${ticket.date}</div>
            <div>FACT: ${ticket.sale_number}</div>
            <div>CAJERO: ${ticket.cajero}</div>
            <div>CLIENTE: ${ticket.customerName}</div>
            ${ticket.customerDoc ? `<div>DOC: ${ticket.customerDoc}</div>` : ''}
            <div style="border-top:2px dashed #000;margin:2mm 0;"></div>
            ${ticket.items.map(i => `
              <div style="margin:2mm 0;">
                <div>${i.qty} x ${i.name.substring(0, 20)}</div>
                <div style="text-align:right;font-size:10px;">$${(i.qty * i.sale_price).toLocaleString()}</div>
              </div>
            `).join('')}
            <div style="border-top:2px dashed #000;margin:2mm 0;"></div>
            <div style="text-align:right;font-size:20px;">TOTAL: $${ticket.total.toLocaleString()}</div>
            <div style="border-top:2px dashed #000;margin:2mm 0;"></div>
            <div>METODO: ${ticket.method}</div>
            <div>RECIBIDO: $${ticket.received.toLocaleString()}</div>
            <div>CAMBIO: $${ticket.change.toLocaleString()}</div>
            <div style="text-align:center;margin-top:5mm;font-size:12px;">*** GRACIAS ***</div>
          </div>
        `;
        
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket - DYNATOS</title>
              <style>
                @page { size: 58mm 297mm; margin: 0; }
                body { margin: 0; padding: 0; }
              </style>
            </head>
            <body>${ticketHTML}</body>
          </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error al imprimir");
    }

    setTimeout(() => {
      clearCart();
      loadAll();
    }, 1000);
  };

  const createSale = async () => {
    try {
      let nameToSend = "CLIENTE GENERAL";
      if (isCustomClient && clientName.trim()) {
        nameToSend =
          clientName.trim() + (clientDoc.trim() ? ` | ${clientDoc.trim()}` : "");
      }

      // ✅ MODIFICADO: Manejar presentaciones en la venta
      const items = cart.map((i) => {
        if (i.is_presentation) {
          // Para presentaciones, enviar la cantidad de unidades base
          return {
            product_id: i.product_id,
            quantity: i.units_per_item * i.qty // Multiplicar por las unidades que representa
          };
        } else {
          // Para productos normales
          return {
            product_id: i.id,
            quantity: i.qty
          };
        }
      });

      const res = await api.post("/sales", {
        cash_drawer_id: cashDrawer.id,
        customer_name: nameToSend,
        items: items
      });

      setSale(res.data.sale);
    } catch {
      alert("Error al registrar venta.");
    }
  };

  const payCash = async () => {
    const received = Number(cashReceived);
    if (received < total) {
      alert("Monto insuficiente");
      return;
    }
    try {
      await api.post("/payments/cash", { sale_id: sale.id, amount: total });
      finalizeTransaction("EFECTIVO", received, received - total);
    } catch {
      alert("Error procesando pago");
    }
  };

  const confirmQRPayment = async () => {
    try {
      await api.post("/payments/qr", {
        sale_id: sale.id,
        amount: total,
        provider: "NEQUI"
      });
      setShowQRConfirm(false);
      finalizeTransaction("TRANSFERENCIA / QR", total, 0);
    } catch {
      alert("Error procesando pago QR");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
      
      {/* SIDEBAR IZQUIERDO */}
      <div style={{ width: "200px", borderRight: "1px solid #D4AF37", padding: "20px", display: "flex", flexDirection: "column", background: "#050505" }}>
        <h3 style={{ color: "#D4AF37", fontSize: "0.8rem", marginBottom: "20px", letterSpacing: "1px" }}>CATEGORÍAS</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <button
            onClick={() => setSelectedCategory("ALL")}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "8px",
              borderRadius: "8px",
              border: "1px solid #333",
              color: selectedCategory === "ALL" ? "#000" : "#fff",
              backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent",
              fontWeight: "bold",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            TODAS
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "8px",
                borderRadius: "8px",
                border: "1px solid #333",
                color: selectedCategory === c.id ? "#000" : "#fff",
                backgroundColor: selectedCategory === c.id ? "#D4AF37" : "transparent",
                cursor: "pointer",
                fontSize: "0.8rem",
                textAlign: "left"
              }}
            >
              {c.name.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #333", paddingTop: "20px", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", color: "#fff" }}>
            <div style={{ background: "#222", padding: "10px", borderRadius: "50%" }}>
              <FiUser color="#D4AF37" />
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "#888" }}>Cajero Activo</p>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.9rem", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {usuarioActual}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCloseCash(true)}
            style={{
              width: "100%",
              padding: "12px",
              background: "#f44",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FiLogOut /> CERRAR TURNO
          </button>
        </div>
      </div>

      {/* PRODUCTOS */}
      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        <h1 style={{ color: "#D4AF37", fontFamily: "serif", margin: "0 0 30px 0", borderBottom: "1px solid #222", paddingBottom: "15px" }}>
          PRODUCTOS
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              disabled={getAvailableStock(p) <= 0}
              style={{
                background: "#111",
                border: "1px solid #222",
                padding: "15px",
                borderRadius: "12px",
                textAlign: "left",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#fff", marginBottom: "5px" }}>{p.name}</div>
              <div style={{ color: "#D4AF37", fontWeight: "bold", fontSize: "1.1rem" }}>${Number(p.sale_price).toLocaleString()}</div>
              <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "5px" }}>Stock: {getAvailableStock(p)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CARRITO */}
      <div style={{ width: "380px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", backgroundColor: "#080808" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #222", color: "#D4AF37", fontWeight: "bold", fontSize: "1.1rem" }}>
          <FiShoppingCart style={{ marginRight: "8px", verticalAlign: "bottom" }} /> TICKETE ACTUAL
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {cart.map((i) => {
            const itemId = i.cart_id || i.id;
            return (
              <div key={itemId} style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "0.9rem", color: "#eee" }}>
                <div style={{ flex: 1 }}>
                  {i.name}
                  {i.is_presentation && (
                    <div style={{ fontSize: "0.7rem", color: "#2ecc71", marginTop: "2px" }}>
                      <FiPackage size={10} style={{ verticalAlign: "middle" }} /> {i.units_per_item}u
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 10px" }}>
                  <button onClick={() => decreaseQty(itemId)} style={{ background: "#222", border: "none", color: "#fff", width: "24px", cursor: "pointer", borderRadius: "4px" }}>
                    -
                  </button>
                  <span>{i.qty}</span>
                  <button onClick={() => increaseQty(itemId)} style={{ background: "#222", border: "none", color: "#fff", width: "24px", cursor: "pointer", borderRadius: "4px" }}>
                    +
                  </button>
                </div>
                <div style={{ color: "#D4AF37" }}>${(i.qty * i.sale_price).toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "25px", backgroundColor: "#000", borderTop: "1px solid #333" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.8rem" }}>
            <span>BASE</span>
            <span>${baseGravable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.8rem", marginBottom: "15px" }}>
            <span>IC / IMPOCONSUMO</span>
            <span>${valorImpuesto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "2rem", fontWeight: "bold", color: "#D4AF37", marginBottom: "20px" }}>
            <span>TOTAL</span>
            <span>${total.toLocaleString()}</span>
          </div>

          {!sale && (
            <div style={{ marginBottom: "15px", padding: "10px", background: "#111", borderRadius: "8px", border: "1px solid #222" }}>
              <div
                onClick={() => setIsCustomClient(!isCustomClient)}
                style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff", cursor: "pointer", fontSize: "0.9rem" }}
              >
                {isCustomClient ? <FiCheckSquare color="#D4AF37" size={20} /> : <FiSquare color="#666" size={20} />}
                <span>Asignar Cliente a Factura</span>
              </div>

              {isCustomClient && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px", outline: "none" }}
                  />
                  <input
                    type="text"
                    placeholder="NIT o Cédula"
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px", outline: "none" }}
                  />
                </div>
              )}
            </div>
          )}

          {!sale ? (
            <button
              onClick={createSale}
              disabled={cart.length === 0}
              style={{
                width: "100%",
                padding: "18px",
                background: "#D4AF37",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer",
                color: "#000"
              }}
            >
              COBRAR
            </button>
          ) : (
            <div style={{ animation: "fadeInUp 0.3s" }}>
              <input
                type="number"
                placeholder="EFECTIVO RECIBIDO"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#111",
                  border: "2px solid #D4AF37",
                  color: "#fff",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "1.5rem",
                  marginBottom: "15px",
                  outline: "none"
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  onClick={payCash}
                  style={{ padding: "15px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                >
                  EFECTIVO
                </button>
                <button
                  onClick={() => setShowQRConfirm(true)}
                  style={{ padding: "15px", border: "1px solid #32CD32", color: "#32CD32", background: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                >
                  NEQUI / QR
                </button>
              </div>
              <button
                onClick={() => setSale(null)}
                style={{ width: "100%", marginTop: "15px", color: "#666", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL DE SELECCIÓN DE PRESENTACIONES */}
      {showPresentationsModal && currentProductPresentations && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(10px)" }}>
          <div style={{ background: "#0a0a0a", maxWidth: "600px", width: "90%", padding: "40px", borderRadius: "30px", border: "2px solid #D4AF37", maxHeight: "80vh", overflowY: "auto" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <div>
                <h2 style={{ color: "#D4AF37", margin: 0, fontSize: "1.8rem" }}>
                  {currentProductPresentations.product_name}
                </h2>
                <p style={{ color: "#666", margin: "5px 0 0 0" }}>
                  Stock disponible: <span style={{ color: "#2ecc71", fontWeight: "bold" }}>{currentProductPresentations.base_stock}</span> unidades
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowPresentationsModal(false);
                  setCurrentProductPresentations(null);
                }}
                style={{ background: "#222", border: "none", borderRadius: "50%", width: "45px", height: "45px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <FiX size={24} color="#fff" />
              </button>
            </div>

            <h3 style={{ color: "#888", fontSize: "1rem", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
              ¿Cómo lo vendes?
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              {currentProductPresentations.presentations.map((pres) => (
                <button
                  key={pres.id}
                  onClick={() => addPresentationToCart(
                    currentProductPresentations.product_id,
                    currentProductPresentations.product_name,
                    pres.id,
                    pres.presentation_name,
                    pres.quantity,
                    pres.sale_price,
                    currentProductPresentations.base_stock
                  )}
                  style={{
                    background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
                    border: "2px solid #D4AF37",
                    borderRadius: "20px",
                    padding: "30px 20px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    textAlign: "center"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.borderColor = "#FFD700";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.borderColor = "#D4AF37";
                  }}
                >
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#D4AF37", marginBottom: "10px" }}>
                    {pres.presentation_name}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#2ecc71", marginBottom: "15px" }}>
                    <FiPackage size={20} />
                    <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                      {pres.quantity} {pres.quantity === 1 ? 'unidad' : 'unidades'}
                    </span>
                  </div>

                  <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#fff" }}>
                    ${Number(pres.sale_price).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showQRConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#111", padding: "30px", border: "1px solid #D4AF37", borderRadius: "15px", textAlign: "center" }}>
            <p style={{ color: "#fff", marginBottom: "20px" }}>¿Confirmas que recibiste la transferencia?</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowQRConfirm(false)} style={{ padding: "10px 20px", background: "#333", color: "#fff", border: "none", borderRadius: "5px" }}>
                Cancelar
              </button>
              <button onClick={confirmQRPayment} style={{ padding: "10px 20px", background: "#D4AF37", border: "none", borderRadius: "5px", fontWeight: "bold" }}>
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseCash && (
        <CerrarCaja
          cashDrawer={cashDrawer}
          onClosed={() => {
            setShowCloseCash(false);
            onCashClosed();
          }}
        />
      )}
    </div>
  );
}
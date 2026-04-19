import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import api from "../api/api";
import CerrarCaja from "./CerrarCaja";
import {
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiCheckSquare,
  FiSquare,
  FiPackage,
  FiX,
  FiPlus,
  FiTag,
  FiSearch
} from "react-icons/fi";

export default function Venta({ cashDrawer, onCashClosed }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [sales, setSales] = useState([
    {
      id: 1,
      customName: "",
      cart: [],
      sale: null,
      preview: null,
      cashReceived: "",
      isCustomClient: false,
      clientName: "",
      clientDoc: ""
    }
  ]);
  const [activeSaleId, setActiveSaleId] = useState(1);
  const [nextSaleId, setNextSaleId] = useState(2);

  const [showQRConfirm, setShowQRConfirm] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [showPresentationsModal, setShowPresentationsModal] = useState(false);
  const [currentProductPresentations, setCurrentProductPresentations] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState("Cajero");

  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  const activeSale = sales.find(s => s.id === activeSaleId);
  const cart = activeSale?.cart || [];
  const sale = activeSale?.sale || null;
  const preview = activeSale?.preview || null;
  const cashReceived = activeSale?.cashReceived || "";
  const isCustomClient = activeSale?.isCustomClient || false;
  const clientName = activeSale?.clientName || "";
  const clientDoc = activeSale?.clientDoc || "";

  const updateActiveSale = useCallback((updates) => {
    setSales(prev => prev.map(s => 
      s.id === activeSaleId ? { ...s, ...updates } : s
    ));
  }, [activeSaleId]);

  // ✅ FUNCIÓN SEGURA PARA GUARDAR EN LOCALSTORAGE
  const saveToLocalStorage = useCallback((data) => {
    try {
      if (!data || !data.sales || !Array.isArray(data.sales)) {
        console.error("❌ Datos inválidos, no se guardará en localStorage");
        return false;
      }

      const jsonString = JSON.stringify(data);
      localStorage.setItem("dynatos_sales", jsonString);
      console.log("💾 Carritos guardados -", new Date().toLocaleTimeString(), `- ${data.sales.length} venta(s)`);
      return true;
    } catch (error) {
      console.error("❌ Error guardando en localStorage:", error);
      return false;
    }
  }, []);

  // ✅ FUNCIÓN SEGURA PARA CARGAR DESDE LOCALSTORAGE
  const loadFromLocalStorage = useCallback(() => {
    try {
      let savedData = localStorage.getItem("dynatos_sales");
      let source = "principal";

      if (!savedData) {
        console.warn("⚠️ No se encontraron datos principales, intentando backup...");
        savedData = localStorage.getItem("dynatos_sales_backup");
        source = "backup";
      }

      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        if (!parsed.sales || !Array.isArray(parsed.sales)) {
          throw new Error("Estructura de datos inválida");
        }

        console.log(`✅ Datos recuperados desde ${source} -`, parsed.sales.length, "venta(s)");
        return parsed;
      }

      return null;
    } catch (error) {
      console.error("❌ Error cargando desde localStorage:", error);
      
      try {
        const backup = localStorage.getItem("dynatos_sales_backup");
        if (backup) {
          const parsed = JSON.parse(backup);
          console.log("✅ Recuperado desde backup después de error");
          localStorage.setItem("dynatos_sales", backup);
          return parsed;
        }
      } catch (backupError) {
        console.error("❌ También falló la recuperación desde backup");
      }

      return null;
    }
  }, []);

  // 🔥 FUNCIÓN CORREGIDA: Sincronizar precios SOLO de productos normales activos
  const syncCartPrices = useCallback((currentProducts) => {
    setSales(prevSales => {
      let hasChanges = false;
      const updatedSales = prevSales.map(sale => {
        const updatedCart = sale.cart.map(cartItem => {
          // 🔥 REGLA 1: Si es presentación, NO sincronizar
          // Las presentaciones tienen su propio precio independiente
          if (cartItem.is_presentation) {
            return cartItem;
          }

          // 🔥 REGLA 2: Buscar solo por ID exacto (productos normales)
          const dbProduct = currentProducts.find(p => p.id === cartItem.id);

          if (!dbProduct) {
            // 🔥 REGLA 3: Producto no encontrado (inactivo o eliminado)
            // NO eliminar del carrito - mantener como está
            console.log(`⚠️ Producto ${cartItem.name} no encontrado en BD, manteniendo precio actual`);
            return cartItem;
          }

          const dbPrice = String(dbProduct.sale_price);
          const cartPrice = String(cartItem.sale_price);

          // Solo sincronizar si el precio cambió
          if (dbPrice !== cartPrice) {
            console.log(`🔄 Actualizando precio de ${cartItem.name}: $${cartPrice} → $${dbPrice}`);
            hasChanges = true;
            return {
              ...cartItem,
              sale_price: dbPrice
            };
          }

          return cartItem;
        });
        // ✅ NO filtrar - mantener todos los productos

        return { ...sale, cart: updatedCart };
      });

      if (hasChanges) {
        console.log("✅ Precios sincronizados automáticamente");
      }

      return updatedSales;
    });
  }, []);

  // ✅ CARGAR CARRITOS AL INICIAR
  useEffect(() => {
    const savedData = loadFromLocalStorage();
  
    if (savedData) {
      setSales(savedData.sales);
      setActiveSaleId(savedData.activeSaleId || 1);
      setNextSaleId(savedData.nextSaleId || 2);
    }

    // Función global para ver backup
    window.verBackup = () => {
      try {
        const backup = localStorage.getItem("dynatos_sales_backup");
        if (!backup) {
          console.log("❌ No hay backup disponible");
          return;
        }

        const data = JSON.parse(backup);
      
        console.log("\n🛡️ ===== BACKUP DE CARRITOS =====");
        console.log(`📅 Última actualización: ${new Date(data.lastUpdate).toLocaleString()}`);
        console.log(`🛒 Total de ventas: ${data.sales.length}\n`);

        data.sales.forEach((sale) => {
          console.log(`\n📦 VENTA #${sale.id} ${sale.customName ? `- "${sale.customName}"` : ""}`);
        
          if (sale.cart.length === 0) {
            console.log("   └─ Carrito vacío");
          } else {
            console.log(`   └─ Productos en carrito (${sale.cart.length}):`);
            sale.cart.forEach((item, i) => {
              const total = item.qty * parseFloat(item.sale_price);
              console.log(`      ${i + 1}. ${item.name}`);
              console.log(`         Cantidad: ${item.qty} x $${parseFloat(item.sale_price).toLocaleString()} = $${total.toLocaleString()}`);
            });
          
            if (sale.preview) {
              console.log(`\n   💰 TOTAL: $${sale.preview.total.toLocaleString()}`);
            }
          }
        });

        console.log("\n=====================================\n");
        console.log("💡 Tip: Para ver el JSON completo escribe: JSON.parse(localStorage.getItem('dynatos_sales_backup'))");
      
      } catch (error) {
        console.error("❌ Error leyendo backup:", error);
      }
    };

    console.log("💡 Comando disponible: verBackup() - Muestra el backup de forma legible");
  }, [loadFromLocalStorage]);

  // ✅ GUARDAR AUTOMÁTICAMENTE CUANDO CAMBIAN LOS DATOS
  useEffect(() => {
    const dataToSave = {
      sales,
      activeSaleId,
      nextSaleId,
      lastUpdate: new Date().toISOString()
    };
    
    saveToLocalStorage(dataToSave);
  }, [sales, activeSaleId, nextSaleId, saveToLocalStorage]);

  // ✅ SISTEMA DE BACKUP AUTOMÁTICO
  useEffect(() => {
    console.log("🛡️ Sistema de backup automático activado");
    
    const backupInterval = setInterval(() => {
      const currentData = localStorage.getItem("dynatos_sales");
      
      if (currentData) {
        try {
          const parsed = JSON.parse(currentData);
          if (parsed.sales && Array.isArray(parsed.sales)) {
            localStorage.setItem("dynatos_sales_backup", currentData);
            console.log("💾 Backup automático guardado -", new Date().toLocaleTimeString());
          }
        } catch (error) {
          console.error("❌ Error creando backup:", error);
        }
      }
    }, 10000);

    return () => {
      clearInterval(backupInterval);
      console.log("🛡️ Sistema de backup desactivado");
    };
  }, []);

  // ✅ HEARTBEAT - PREVENIR CIERRE DE SESIÓN
  useEffect(() => {
    console.log("🔒 Sistema anti-cierre de sesión activado");
    
    const keepSessionAlive = setInterval(async () => {
      try {
        await api.get("/categories");
        console.log("✅ Sesión renovada -", new Date().toLocaleTimeString());
      } catch (error) {
        console.warn("⚠️ Error renovando sesión, reintentando...");
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(keepSessionAlive);
      console.log("🔓 Sistema anti-cierre desactivado");
    };
  }, []);

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

  // 🔥 FUNCIÓN ACTUALIZADA: Cargar productos y sincronizar carritos
  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products")
      ]);
      setCategories(catRes.data?.items ?? []);
      const loadedProducts = prodRes.data?.items ?? [];
      setProducts(loadedProducts);

      // 🔥 SINCRONIZAR PRECIOS AUTOMÁTICAMENTE
      syncCartPrices(loadedProducts);
    } catch {
      console.error("Error datos");
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = selectedCategory === "ALL" 
      ? products 
      : products.filter((p) => p.category_id === selectedCategory);
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        String(p.barcode || "").includes(term) ||
        String(p.sku || "").includes(term)
      );
    }
    
    return filtered;
  }, [products, selectedCategory, searchTerm]);

  const getAvailableStock = useCallback((product) => {
    let totalInAllCarts = 0;

    sales.forEach(saleObj => {
      const normalInCart = saleObj.cart
        .filter((i) => i.id === product?.id && !i.is_presentation)
        .reduce((sum, i) => sum + i.qty, 0);
      
      const presentationsInCart = saleObj.cart
        .filter((i) => i.product_id === product?.id && i.is_presentation)
        .reduce((sum, i) => sum + (i.units_per_item * i.qty), 0);
      
      totalInAllCarts += normalInCart + presentationsInCart;
    });
    
    return Number(product?.current_stock || 0) - totalInAllCarts;
  }, [sales]);

  const addPresentationToCart = useCallback((productId, productName, presentationId, presentationName, quantity, price, baseStock) => {
    setSales(prevSales => {
      const currentSale = prevSales.find(s => s.id === activeSaleId);
      if (!currentSale) return prevSales;

      let totalUnitsInAllCarts = 0;
      prevSales.forEach(saleObj => {
        totalUnitsInAllCarts += saleObj.cart
          .filter(item => item.product_id === productId)
          .reduce((sum, item) => sum + (item.units_per_item * item.qty), 0);
      });
      
      const availableUnits = baseStock - totalUnitsInAllCarts;
      
      if (availableUnits < quantity) {
        alert(`Stock insuficiente. Disponible: ${availableUnits} unidades`);
        return prevSales;
      }

      const cartItemId = `${productId}-${presentationId}`;
      const found = currentSale.cart.find((item) => item.cart_id === cartItemId);
      
      let newCart;
      if (found) {
        newCart = currentSale.cart.map((item) =>
          item.cart_id === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        newCart = [
          ...currentSale.cart,
          {
            cart_id: cartItemId,
            product_id: productId,
            presentation_id: presentationId,
            name: `${productName} - ${presentationName}`,
            sale_price: price,
            units_per_item: quantity,
            qty: 1,
            is_presentation: true
          }
        ];
      }

      return prevSales.map(s => 
        s.id === activeSaleId ? { ...s, cart: newCart } : s
      );
    });

    setShowPresentationsModal(false);
    setCurrentProductPresentations(null);
  }, [activeSaleId]);

  const addProduct = useCallback(async (p) => {
    if (getAvailableStock(p) <= 0) return;

    try {
      const res = await api.get(`/presentations/${p.id}/presentations`);
      const presentations = res.data.items || [];

      if (presentations.length === 0) {
        setSales(prevSales => {
          const currentSale = prevSales.find(s => s.id === activeSaleId);
          if (!currentSale) return prevSales;

          const found = currentSale.cart.find((item) => item.id === p.id && !item.is_presentation);
          let newCart;
          
          if (found) {
            newCart = currentSale.cart.map((item) =>
              item.id === p.id && !item.is_presentation ? { ...item, qty: item.qty + 1 } : item
            );
          } else {
            newCart = [...currentSale.cart, { 
              ...p, 
              cart_id: `prod-${p.id}-${Date.now()}`,
              qty: 1, 
              is_presentation: false 
            }];
          }

          return prevSales.map(s => 
            s.id === activeSaleId ? { ...s, cart: newCart } : s
          );
        });
      } else if (presentations.length === 1) {
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
      console.log("No se encontraron presentaciones, agregando como producto normal");
      setSales(prevSales => {
        const currentSale = prevSales.find(s => s.id === activeSaleId);
        if (!currentSale) return prevSales;

        const found = currentSale.cart.find((item) => item.id === p.id && !item.is_presentation);
        let newCart;
        
        if (found) {
          newCart = currentSale.cart.map((item) =>
            item.id === p.id && !item.is_presentation ? { ...item, qty: item.qty + 1 } : item
          );
        } else {
          newCart = [...currentSale.cart, { 
            ...p, 
            cart_id: `prod-${p.id}-${Date.now()}`,
            qty: 1, 
            is_presentation: false 
          }];
        }

        return prevSales.map(s => 
          s.id === activeSaleId ? { ...s, cart: newCart } : s
        );
      });
    }
  }, [activeSaleId, getAvailableStock, addPresentationToCart]);

  useEffect(() => {
    const handleBarcodeScan = async (codeRaw) => {
      const code = String(codeRaw || "").trim();
      if (!code) return;

      try {
        const res = await api.get(`/presentations/search?q=${code}`);
        const data = res.data;

        if (data.single_presentation) {
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
          setCurrentProductPresentations(data);
          setShowPresentationsModal(true);
        }
      } catch (error) {
        console.log("🔎 Código no encontrado:", code);
        const found =
          products.find((p) => String(p.barcode || "").trim() === code) ||
          products.find((p) => String(p.sku || "").trim() === code);

        if (found) {
          addProduct(found);
        }
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Shift" || e.key === "Alt" || e.key === "Control" || e.key === "Meta") return;

      const activeEl = document.activeElement;
      const tagName = activeEl?.tagName?.toLowerCase();
      const isTypingInInput = tagName === "input" || tagName === "textarea" || activeEl?.isContentEditable;

      if (isTypingInInput) {
        scanBufferRef.current = "";
        return;
      }

      const now = Date.now();
      const delta = now - (lastKeyTimeRef.current || 0);
      lastKeyTimeRef.current = now;

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
        scanBufferRef.current = "";
        return;
      }

      if (delta < 50) {
        scanBufferRef.current += e.key;
      } else {
        scanBufferRef.current = e.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [products, addProduct, addPresentationToCart]);

  const increaseQty = (cartId) => {
    updateActiveSale({
      cart: cart.map((p) => (p.cart_id === cartId || p.id === cartId ? { ...p, qty: p.qty + 1 } : p))
    });
  };

  const decreaseQty = (cartId) => {
    updateActiveSale({
      cart: cart
        .map((p) => (p.cart_id === cartId || p.id === cartId ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    });
  };

  const clearCart = () => {
    updateActiveSale({
      cart: [],
      sale: null,
      preview: null,
      cashReceived: "",
      isCustomClient: false,
      clientName: "",
      clientDoc: ""
    });
  };

  const createNewSale = () => {
    const newSale = {
      id: nextSaleId,
      customName: "",
      cart: [],
      sale: null,
      preview: null,
      cashReceived: "",
      isCustomClient: false,
      clientName: "",
      clientDoc: ""
    };
    setSales(prev => [...prev, newSale]);
    setActiveSaleId(nextSaleId);
    setNextSaleId(prev => prev + 1);
  };

  const closeSale = (saleId) => {
    if (sales.length === 1) {
      clearCart();
    } else {
      setSales(prev => prev.filter(s => s.id !== saleId));
      if (activeSaleId === saleId) {
        const remaining = sales.filter(s => s.id !== saleId);
        setActiveSaleId(remaining[0].id);
      }
    }
  };

  const editSaleName = (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    const currentName = sale?.customName || `Venta ${saleId}`;
    const newName = prompt("Nombre de la venta:", currentName);
    
    if (newName !== null && newName.trim()) {
      setSales(prev => prev.map(s => 
        s.id === saleId ? { ...s, customName: newName.trim() } : s
      ));
    }
  };

  const fetchPreview = async () => {
    if (!cashDrawer?.id || cart.length === 0) {
      updateActiveSale({ preview: null });
      return;
    }

    try {
      const items = cart.map((i) => {
        if (i.is_presentation) {
          return {
            product_id: i.product_id,
            quantity: i.units_per_item * i.qty,
            unit_price_override: i.sale_price / i.units_per_item
          };
        } else {
          return {
            product_id: i.id,
            quantity: i.qty
          };
        }
      });

      const res = await api.post("/sales/preview", {
        cash_drawer_id: cashDrawer.id,
        items: items
      });

      updateActiveSale({ preview: res.data });
    } catch (error) {
      console.error("Error fetching preview:", error);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [cart, cashDrawer?.id]);

  const total = preview?.total ?? 0;
  const valorImpuesto = preview?.tax_total ?? 0;
  const baseGravable = preview?.subtotal ?? 0;
  const promoDiscount = preview?.promo_discount_total ?? 0;

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
                <div style="word-wrap:break-word;max-width:50mm;">${i.qty} x ${i.name}</div>
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
      closeSale(activeSaleId);
      loadAll();
      console.log("✅ Venta completada - carrito limpiado - localStorage preservado");
    }, 1000);
  };

  const createSale = async () => {
    try {
      let nameToSend = "CLIENTE GENERAL";
      if (isCustomClient && clientName.trim()) {
        nameToSend =
          clientName.trim() + (clientDoc.trim() ? ` | ${clientDoc.trim()}` : "");
      }

      const items = cart.map((i) => {
        if (i.is_presentation) {
          return {
            product_id: i.product_id,
            quantity: i.units_per_item * i.qty,
            unit_price_override: i.sale_price / i.units_per_item
          };
        } else {
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

      updateActiveSale({ sale: res.data.sale });
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
      
      <div style={{ width: "200px", borderRight: "1px solid #D4AF37", padding: "15px", display: "flex", flexDirection: "column", background: "#050505" }}>
        <h3 style={{ color: "#D4AF37", fontSize: "0.75rem", marginBottom: "15px", letterSpacing: "1px" }}>CATEGORÍAS</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <button
            onClick={() => setSelectedCategory("ALL")}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "6px",
              borderRadius: "6px",
              border: "1px solid #333",
              color: selectedCategory === "ALL" ? "#000" : "#fff",
              backgroundColor: selectedCategory === "ALL" ? "#D4AF37" : "transparent",
              fontWeight: "bold",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.75rem"
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
                padding: "10px",
                marginBottom: "6px",
                borderRadius: "6px",
                border: "1px solid #333",
                color: selectedCategory === c.id ? "#000" : "#fff",
                backgroundColor: selectedCategory === c.id ? "#D4AF37" : "transparent",
                cursor: "pointer",
                fontSize: "0.7rem",
                textAlign: "left"
              }}
            >
              {c.name.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #333", paddingTop: "15px", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#fff" }}>
            <div style={{ background: "#222", padding: "8px", borderRadius: "50%" }}>
              <FiUser color="#D4AF37" size={14} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: "0.65rem", color: "#888" }}>Cajero</p>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.8rem", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {usuarioActual}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCloseCash(true)}
            style={{
              width: "100%",
              padding: "10px",
              background: "#f44",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "0.75rem"
            }}
          >
            <FiLogOut size={12} /> CERRAR
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        <div style={{ borderBottom: "1px solid #222", background: "#050505", padding: "8px 15px", display: "flex", gap: "8px", overflowX: "auto" }}>
          {sales.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSaleId(s.id)}
              style={{
                position: "relative",
                padding: "8px 12px",
                borderRadius: "6px 6px 0 0",
                background: activeSaleId === s.id ? "#D4AF37" : "#111",
                color: activeSaleId === s.id ? "#000" : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minWidth: "100px",
                fontWeight: "bold",
                fontSize: "0.8rem",
                border: activeSaleId === s.id ? "2px solid #D4AF37" : "1px solid #333",
                borderBottom: "none"
              }}
            >
              <FiShoppingCart size={14} />
              <span 
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  editSaleName(s.id);
                }}
                title="Doble click para editar"
              >
                {s.customName || `Venta ${s.id}`}
              </span>
              {s.cart.length > 0 && (
                <span style={{
                  background: activeSaleId === s.id ? "#000" : "#D4AF37",
                  color: activeSaleId === s.id ? "#D4AF37" : "#000",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: "bold"
                }}>
                  {s.cart.length}
                </span>
              )}
              {sales.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSale(s.id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: activeSaleId === s.id ? "#000" : "#666",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={createNewSale}
            style={{
              padding: "8px 12px",
              borderRadius: "6px 6px 0 0",
              background: "#111",
              color: "#D4AF37",
              border: "1px solid #333",
              borderBottom: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.8rem",
              fontWeight: "bold"
            }}
          >
            <FiPlus size={14} /> Nueva
          </button>
        </div>

        <div style={{ flex: 1, padding: "15px", overflowY: "auto" }}>
          <h1 style={{ color: "#D4AF37", fontFamily: "serif", margin: "0 0 15px 0", borderBottom: "1px solid #222", paddingBottom: "10px", fontSize: "1.5rem" }}>
            PRODUCTOS
          </h1>
          
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#D4AF37" }} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                borderRadius: "8px",
                border: "1px solid #D4AF37",
                backgroundColor: "#111",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                disabled={getAvailableStock(p) <= 0}
                style={{
                  background: "#111",
                  border: "1px solid #222",
                  padding: "12px",
                  borderRadius: "10px",
                  textAlign: "left",
                  cursor: getAvailableStock(p) <= 0 ? "not-allowed" : "pointer",
                  opacity: getAvailableStock(p) <= 0 ? 0.5 : 1
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "0.8rem", color: "#fff", marginBottom: "4px", lineHeight: "1.2" }}>{p.name}</div>
                <div style={{ color: "#D4AF37", fontWeight: "bold", fontSize: "1rem" }}>${Number(p.sale_price).toLocaleString()}</div>
                <div style={{ fontSize: "0.65rem", color: "#666", marginTop: "4px" }}>Stock: {getAvailableStock(p)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: "350px", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", backgroundColor: "#080808" }}>
        <div style={{ padding: "15px", borderBottom: "1px solid #222", color: "#D4AF37", fontWeight: "bold", fontSize: "1rem" }}>
          <FiShoppingCart style={{ marginRight: "6px", verticalAlign: "bottom" }} /> VENTA {activeSaleId}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
          {cart.map((i, index) => {
            const itemId = i.cart_id || `item-${i.id}-${index}`;
            const previewItem = preview?.items?.[index] || null;
            const hasPromo = previewItem && previewItem.discount_amount > 0;
            
            return (
              <div key={itemId} style={{ marginBottom: "12px", padding: "10px", background: hasPromo ? "#1a2e1a" : "transparent", borderRadius: "6px", border: hasPromo ? "1px solid #2ecc71" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#eee" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "0.8rem" }}>{i.name}</span>
                      {hasPromo && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "#2ecc71", color: "#000", padding: "2px 4px", borderRadius: "3px", fontSize: "0.6rem", fontWeight: "bold" }}>
                          <FiTag size={8} /> PROMO
                        </span>
                      )}
                    </div>
                    {i.is_presentation && (
                      <div style={{ fontSize: "0.65rem", color: "#2ecc71", marginTop: "2px" }}>
                        <FiPackage size={8} style={{ verticalAlign: "middle" }} /> {i.units_per_item}u
                      </div>
                    )}
                    {hasPromo && (
                      <div style={{ fontSize: "0.65rem", color: "#2ecc71", marginTop: "2px" }}>
                        Ahorro: ${previewItem.discount_amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 8px" }}>
                    <button onClick={() => decreaseQty(i.cart_id || i.id)} style={{ background: "#222", border: "none", color: "#fff", width: "22px", height: "22px", cursor: "pointer", borderRadius: "4px", fontSize: "0.8rem" }}>
                      -
                    </button>
                    <span style={{ fontSize: "0.85rem" }}>{i.qty}</span>
                    <button onClick={() => increaseQty(i.cart_id || i.id)} style={{ background: "#222", border: "none", color: "#fff", width: "22px", height: "22px", cursor: "pointer", borderRadius: "4px", fontSize: "0.8rem" }}>
                      +
                    </button>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {hasPromo && (
                      <div style={{ fontSize: "0.65rem", color: "#888", textDecoration: "line-through" }}>
                        ${(i.qty * i.sale_price).toLocaleString()}
                      </div>
                    )}
                    <div style={{ color: hasPromo ? "#2ecc71" : "#D4AF37", fontWeight: "bold", fontSize: "0.85rem" }}>
                      ${previewItem ? previewItem.total.toLocaleString() : (i.qty * i.sale_price).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "20px", backgroundColor: "#000", borderTop: "1px solid #333" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.75rem" }}>
            <span>BASE</span>
            <span>${baseGravable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.75rem" }}>
            <span>IC</span>
            <span>${valorImpuesto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          {promoDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#2ecc71", fontSize: "0.75rem", fontWeight: "bold" }}>
              <span>🎉 PROMOS</span>
              <span>-${promoDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.8rem", fontWeight: "bold", color: "#D4AF37", marginTop: "12px", marginBottom: "15px" }}>
            <span>TOTAL</span>
            <span>${total.toLocaleString()}</span>
          </div>

          {!sale && (
            <div style={{ marginBottom: "12px", padding: "10px", background: "#111", borderRadius: "6px", border: "1px solid #222" }}>
              <div
                onClick={() => updateActiveSale({ isCustomClient: !isCustomClient })}
                style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", cursor: "pointer", fontSize: "0.85rem" }}
              >
                {isCustomClient ? <FiCheckSquare color="#D4AF37" size={18} /> : <FiSquare color="#666" size={18} />}
                <span>Asignar Cliente</span>
              </div>

              {isCustomClient && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={clientName}
                    onChange={(e) => updateActiveSale({ clientName: e.target.value })}
                    style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px", outline: "none", fontSize: "0.85rem" }}
                  />
                  <input
                    type="text"
                    placeholder="NIT o Cédula"
                    value={clientDoc}
                    onChange={(e) => updateActiveSale({ clientDoc: e.target.value })}
                    style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px", outline: "none", fontSize: "0.85rem" }}
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
                padding: "16px",
                background: cart.length === 0 ? "#333" : "#D4AF37",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: cart.length === 0 ? "not-allowed" : "pointer",
                color: "#000",
                opacity: cart.length === 0 ? 0.5 : 1
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
                onChange={(e) => updateActiveSale({ cashReceived: e.target.value })}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#111",
                  border: "2px solid #D4AF37",
                  color: "#fff",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "1.3rem",
                  marginBottom: "12px",
                  outline: "none"
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  onClick={payCash}
                  style={{ padding: "14px", background: "#D4AF37", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}
                >
                  EFECTIVO
                </button>
                <button
                  onClick={() => setShowQRConfirm(true)}
                  style={{ padding: "14px", border: "1px solid #32CD32", color: "#32CD32", background: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}
                >
                  NEQUI
                </button>
              </div>
              <button
                onClick={() => updateActiveSale({ sale: null })}
                style={{ width: "100%", marginTop: "12px", color: "#666", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem" }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {showPresentationsModal && currentProductPresentations && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(10px)" }}>
          <div style={{ background: "#0a0a0a", maxWidth: "600px", width: "90%", padding: "30px", borderRadius: "20px", border: "2px solid #D4AF37", maxHeight: "80vh", overflowY: "auto" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ color: "#D4AF37", margin: 0, fontSize: "1.5rem" }}>
                  {currentProductPresentations.product_name}
                </h2>
                <p style={{ color: "#666", margin: "5px 0 0 0", fontSize: "0.85rem" }}>
                  Stock: <span style={{ color: "#2ecc71", fontWeight: "bold" }}>{currentProductPresentations.base_stock}</span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowPresentationsModal(false);
                  setCurrentProductPresentations(null);
                }}
                style={{ background: "#222", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <FiX size={20} color="#fff" />
              </button>
            </div>

            <h3 style={{ color: "#888", fontSize: "0.9rem", marginBottom: "15px", textTransform: "uppercase", letterSpacing: "1px" }}>
              ¿Cómo lo vendes?
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px" }}>
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
                    borderRadius: "15px",
                    padding: "25px 15px",
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
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#D4AF37", marginBottom: "8px" }}>
                    {pres.presentation_name}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#2ecc71", marginBottom: "12px" }}>
                    <FiPackage size={18} />
                    <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
                      {pres.quantity} {pres.quantity === 1 ? 'ud' : 'uds'}
                    </span>
                  </div>

                  <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#fff" }}>
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
          <div style={{ background: "#111", padding: "25px", border: "1px solid #D4AF37", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ color: "#fff", marginBottom: "15px" }}>¿Confirmas la transferencia?</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowQRConfirm(false)} style={{ padding: "10px 18px", background: "#333", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={confirmQRPayment} style={{ padding: "10px 18px", background: "#D4AF37", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>
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
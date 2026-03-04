import { useState } from "react";
import AdminPromotions from "./AdminPromotions";
import AdminPromotionsV2 from "./AdminPromotionsV2";
import { FiTag, FiGift } from "react-icons/fi";

export default function AdminPromotionsUnified() {
  const [activeTab, setActiveTab] = useState("simple");

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
      
      {/* TABS */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        marginBottom: "30px",
        borderBottom: "2px solid #222"
      }}>
        <button
          onClick={() => setActiveTab("simple")}
          style={{
            padding: "15px 30px",
            backgroundColor: activeTab === "simple" ? "#D4AF37" : "transparent",
            color: activeTab === "simple" ? "#000" : "#D4AF37",
            border: "none",
            borderBottom: activeTab === "simple" ? "3px solid #D4AF37" : "3px solid transparent",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s",
            borderRadius: "8px 8px 0 0"
          }}
        >
          <FiTag size={20} />
          PROMOCIONES SIMPLES
          <span style={{ 
            fontSize: "0.7rem", 
            padding: "2px 8px", 
            background: activeTab === "simple" ? "#000" : "#222",
            color: activeTab === "simple" ? "#D4AF37" : "#888",
            borderRadius: "4px",
            fontWeight: "normal"
          }}>
            PACK / INDIVIDUAL
          </span>
        </button>

        <button
          onClick={() => setActiveTab("advanced")}
          style={{
            padding: "15px 30px",
            backgroundColor: activeTab === "advanced" ? "#D4AF37" : "transparent",
            color: activeTab === "advanced" ? "#000" : "#D4AF37",
            border: "none",
            borderBottom: activeTab === "advanced" ? "3px solid #D4AF37" : "3px solid transparent",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s",
            borderRadius: "8px 8px 0 0"
          }}
        >
          <FiGift size={20} />
          PROMOCIONES AVANZADAS
          <span style={{ 
            fontSize: "0.7rem", 
            padding: "2px 8px", 
            background: activeTab === "advanced" ? "#000" : "#222",
            color: activeTab === "advanced" ? "#D4AF37" : "#888",
            borderRadius: "4px",
            fontWeight: "normal"
          }}>
            COMBOS / MONTOS
          </span>
        </button>
      </div>

      {/* CONTENIDO */}
      <div style={{ animation: "fadeIn 0.3s" }}>
        {activeTab === "simple" && <AdminPromotions />}
        {activeTab === "advanced" && <AdminPromotionsV2 />}
      </div>

    </div>
  );
}
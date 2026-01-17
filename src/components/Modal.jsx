// src/components/Modal.jsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ children, onClose }) {
  // ESC para cerrar
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] bg-black/60 flex items-center justify-center"
      style={{ pointerEvents: "auto" }}
      onMouseDown={() => onClose?.()}
    >
      <div
        className="pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

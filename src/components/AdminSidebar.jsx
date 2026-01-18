import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiTag, FiUsers, FiShoppingBag, FiLogOut 
} from 'react-icons/fi'; 

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    // Usamos assign para asegurar una limpieza total del estado del navegador
    window.location.assign("/login");
  };

  const menuItems = [
    { path: '/admin', icon: <FiHome />, label: 'Dashboard' },
    { path: '/admin/productos', icon: <FiPackage />, label: 'Productos' },
    { path: '/admin/promociones', icon: <FiTag />, label: 'Promociones' },
    { path: '/admin/usuarios', icon: <FiUsers />, label: 'Cajeros' },
    { path: '/admin/ventas', icon: <FiShoppingBag />, label: 'Ventas' },
  ];

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#050505', // Negro profundo premium
      color: '#E0E0E0',
      padding: '25px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 15px rgba(0,0,0,0.6)',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000
    }}>
      {/* Logo / Título */}
      <div style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h2 style={{ 
          color: '#D4AF37', 
          fontSize: '1.8rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: 0,
          fontFamily: 'serif'
        }}>
          Dynatos
        </h2>
        <span style={{ fontSize: '0.7rem', color: '#D4AF37', opacity: 0.8, letterSpacing: '3px' }}>
          MARKET & LICORERÍA
        </span>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} style={{ marginBottom: '12px' }}>
                <Link 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 18px',
                    textDecoration: 'none',
                    color: isActive ? '#000' : '#b3b3b3',
                    backgroundColor: isActive ? '#D4AF37' : 'transparent',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    fontWeight: isActive ? 'bold' : 'normal',
                    border: isActive ? '1px solid #D4AF37' : '1px solid transparent'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#D4AF37';
                      e.currentTarget.style.border = '1px solid #D4AF37';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#b3b3b3';
                      e.currentTarget.style.border = '1px solid transparent';
                    }
                  }}
                >
                  <span style={{ marginRight: '12px', fontSize: '1.3rem', display: 'flex' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Botón Salir */}
      <button 
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          border: '1px solid #D4AF37',
          backgroundColor: 'transparent',
          color: '#D4AF37',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          width: '100%',
          fontSize: '1rem',
          fontWeight: 'bold',
          marginTop: 'auto'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#D4AF37';
          e.currentTarget.style.color = '#000';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#D4AF37';
        }}
      >
        <FiLogOut style={{ marginRight: '10px' }} />
        Cerrar sesión
      </button>
    </div>
  );
};

// 🔒 ESTA ES LA LÍNEA CRUCIAL PARA VERCEL:
export default AdminSidebar;
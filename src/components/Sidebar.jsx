import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiTag, FiUsers, FiShoppingBag, FiLogOut 
} from 'react-icons/fi'; 

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Ajusta esto según tu lógica
    navigate('/login'); 
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FiPackage />, label: 'Productos' },
    { path: '/admin/promotions', icon: <FiTag />, label: 'Promociones' },
    { path: '/admin/users', icon: <FiUsers />, label: 'Cajeros' },
    { path: '/admin/sales', icon: <FiShoppingBag />, label: 'Ventas' },
  ];

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#0a0a0a', // Fondo casi negro (Estilo Premium)
      color: '#E0E0E0',
      padding: '25px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 10px rgba(0,0,0,0.5)', // Sombra más elegante
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000
    }}>
      {/* Título de la Marca */}
      <div style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h2 style={{ 
          color: '#D4AF37', // Dorado
          fontSize: '1.8rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: 0,
          fontFamily: 'serif' // Fuente más elegante
        }}>
          Dynatos
        </h2>
        <span style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '4px' }}>PREMIUM POS</span>
      </div>

      {/* Enlaces del Menú */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} style={{ marginBottom: '15px' }}>
                <Link 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    textDecoration: 'none',
                    color: isActive ? '#000' : '#b3b3b3', // Texto negro si está activo (contraste con dorado)
                    backgroundColor: isActive ? '#D4AF37' : 'transparent', // Fondo dorado activo
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
                  <span style={{ marginRight: '15px', fontSize: '1.3rem' }}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Botón de Cerrar Sesión */}
      <button 
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          border: '1px solid #D4AF37', // ✅ CORREGIDO: Aquí estaba el error
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
        <span style={{ marginRight: '10px' }}><FiLogOut /></span>
        Cerrar sesión
      </button>
    </div>
  );
};

export default AdminSidebar;
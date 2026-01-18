import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiTag, FiUsers, FiShoppingBag, FiLogOut 
} from 'react-icons/fi'; // Asegúrate de tener react-icons instalado: npm install react-icons

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí tu lógica para cerrar sesión (borrar token, etc.)
    console.log('Cerrando sesión...');
    navigate('/login'); // Redirige al login
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
      width: '250px',
      height: '100vh',
      backgroundColor: '#121212', // Fondo oscuro premium
      color: '#E0E0E0', // Texto claro
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 5px rgba(0,0,0,0.3)',
      position: 'fixed', // Fijo a la izquierda
      left: 0,
      top: 0
    }}>
      {/* Título de la Marca */}
      <h2 style={{ 
        color: '#D4AF37', // Dorado
        textAlign: 'center', 
        marginBottom: '40px',
        fontSize: '1.5rem',
        letterSpacing: '1px'
      }}>
        DYNATOS ADMIN
      </h2>

      {/* Enlaces del Menú */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} style={{ marginBottom: '10px' }}>
                <Link 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 15px',
                    textDecoration: 'none',
                    color: isActive ? '#121212' : '#E0E0E0',
                    backgroundColor: isActive ? '#D4AF37' : 'transparent', // Fondo dorado si está activo
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    fontWeight: isActive ? 'bold' : 'normal'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#1F1F1F'; // Efecto hover sutil
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ marginRight: '15px', fontSize: '1.2rem' }}>{item.icon}</span>
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
          padding: '12px 15px',
          border: '1px solid '#D4AF37',
          backgroundColor: 'transparent',
          color: '#D4AF37',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          width: '100%',
          fontSize: '1rem'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#D4AF37';
          e.currentTarget.style.color = '#121212';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#D4AF37';
        }}
      >
        <span style={{ marginRight: '15px', fontSize: '1.2rem' }}><FiLogOut /></span>
        Cerrar sesión
      </button>
    </div>
  );
};

export default Sidebar;
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Petición al backend de Dynatos
      const res = await axios.post('https://dynatos-pos-backend-1.onrender.com/auth/login', { 
        username, 
        password 
      });
      
      // Guardado de sesión
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirección al home dinámico
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error: Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050505', // Negro base
      backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '50px 40px',
        backgroundColor: '#111',
        borderRadius: '20px',
        border: '1px solid #D4AF37', // Borde Dorado
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        textAlign: 'center'
      }}>
        {/* Encabezado Premium */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            color: '#D4AF37', 
            fontSize: '2.5rem', 
            letterSpacing: '4px', 
            margin: '0',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            Dynatos
          </h1>
          <p style={{ 
            color: '#888', 
            fontSize: '0.8rem', 
            letterSpacing: '3px', 
            marginTop: '5px',
            textTransform: 'uppercase'
          }}>
            Market & Licorería Premium
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: '#D4AF37', fontSize: '0.8rem', marginLeft: '5px', marginBottom: '5px', display: 'block' }}>
              USUARIO
            </label>
            <input 
              type="text" 
              placeholder="Ingrese su usuario" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '15px', 
                borderRadius: '10px', 
                border: '1px solid #333', 
                backgroundColor: '#1a1a1a', 
                color: '#fff', 
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ color: '#D4AF37', fontSize: '0.8rem', marginLeft: '5px', marginBottom: '5px', display: 'block' }}>
              CONTRASEÑA
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '15px', 
                borderRadius: '10px', 
                border: '1px solid #333', 
                backgroundColor: '#1a1a1a', 
                color: '#fff', 
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '1rem'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '16px', 
              borderRadius: '10px', 
              border: 'none', 
              backgroundColor: loading ? '#555' : '#D4AF37', 
              color: '#000',
              fontWeight: 'bold', 
              fontSize: '1rem', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              transition: 'all 0.3s ease',
              marginTop: '15px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#f1c40f' }}
            onMouseOut={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#D4AF37' }}
          >
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <footer style={{ marginTop: '30px', color: '#444', fontSize: '0.7rem' }}>
          &copy; 2026 Dynatos POS System - Acceso Restringido
        </footer>
      </div>
    </div>
  );
};

export default Login;
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const useAuth = () => {
  const [usuario, setUsuario] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const verificarToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('Verificando token:', token ? 'Token presente' : 'Sin token');

    if (!token) {
      setIsAuthenticated(false);
      setUsuario(null);
      setIsLoading(false);
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('Token decodificado:', decoded);
      const response = await axios.get('http://localhost:5000/api/auth/verificar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Respuesta de verificación:', response.data);
      setUsuario(response.data.usuario);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error al verificar token:', error.response?.data || error.message);
      setIsAuthenticated(false);
      setUsuario(null);
      localStorage.removeItem('token');
      setIsLoading(false);
      navigate('/login', { replace: true });
      return false;
    }
  }, [navigate]);

  useEffect(() => {
    // Verificar token al montar el componente
    let isMounted = true;

    const checkToken = async () => {
      if (isMounted) {
        await verificarToken();
      }
    };

    checkToken();

    // Verificar token cada 5 minutos
    const interval = setInterval(() => {
      if (isMounted) {
        verificarToken();
      }
    }, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [verificarToken]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUsuario(null);
    setIsLoading(false);
    navigate('/login', { replace: true });
    console.log('Sesión cerrada');
  };

  return { usuario, isAuthenticated, isLoading, verificarToken, cerrarSesion };
};

export default useAuth;
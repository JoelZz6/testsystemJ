import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import { SocketContext } from '../SocketContext';

function Bienvenida() {
  const { isAuthenticated, isLoading } = useAuth();
  const socket = useContext(SocketContext);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  console.log('Bienvenida - Estado:', { isAuthenticated, isLoading });

  // Redirigir si no está autenticado y la verificación ha terminado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Redirigiendo a /login desde Bienvenida');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Cargar productos iniciales
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/productos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Productos cargados:', response.data.productos);
        setProductos(response.data.productos);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar productos');
        console.error('Error al cargar productos:', err);
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
        }
      }
    };
    if (isAuthenticated && !isLoading) {
      fetchProductos();
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Escuchar eventos WebSocket
  useEffect(() => {
    if (socket) {
      socket.on('nuevoProducto', (producto) => {
        setProductos((prev) => {
          // Evitar duplicados basados en id
          if (prev.some((p) => p.id === producto.id)) {
            return prev;
          }
          return [...prev, producto];
        });
      });

      socket.on('productoActualizado', (producto) => {
        setProductos((prev) =>
          prev.map((p) => (p.id === producto.id ? { ...p, ...producto } : p))
        );
      });

      socket.on('productoEliminado', ({ id }) => {
        setProductos((prev) => prev.filter((p) => p.id !== id));
      });

      return () => {
        socket.off('nuevoProducto');
        socket.off('productoActualizado');
        socket.off('productoEliminado');
      };
    }
  }, [socket]);

  if (isLoading) {
    return <div className="container mx-auto p-4">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Productos Disponibles</h2>
      {error && <p className="text-red-500">{error}</p>}
      {productos.length === 0 ? (
        <p>No hay productos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((producto, index) => (
            <div key={`${producto.id}-${index}`} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{producto.nombre}</h3>
              <p>{producto.descripcion || 'Sin descripción'}</p>
              {producto.imagen && (
                <img
                  src={`http://localhost:5000${producto.imagen}`}
                  alt={producto.nombre}
                  className="w-full h-48 object-cover mt-2"
                />
              )}
              <p>Stock: {producto.stock}</p>
              <p>Precio: ${producto.precio}</p>
              <p>Puesto: {producto.microempresa_nombre}</p>
              {producto.atributos.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Atributos:</p>
                  <ul>
                    {producto.atributos.map((attr, idx) => (
                      <li key={idx}>{attr.clave}: {attr.valor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bienvenida;
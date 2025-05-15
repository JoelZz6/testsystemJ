import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import { SocketContext } from '../SocketContext';

function GestionarMicroempresas() {
  const { usuario, isAuthenticated, isLoading } = useAuth();
  const socket = useContext(SocketContext);
  const [microempresa, setMicroempresa] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productoForm, setProductoForm] = useState({
    nombre: '',
    descripcion: '',
    imagen: null,
    stock: '',
    precio: '',
    atributos: [{ clave: '', valor: '' }],
  });
  const [productoEditando, setProductoEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  console.log('GestionarMicroempresas - Estado:', { isAuthenticated, isLoading, usuario });

  // Redirigir si no está autenticado o no es comerciante/administrador
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || (usuario?.rol !== 'comerciante' && usuario?.rol !== 'administrador')) {
        console.log('Redirigiendo a /bienvenida desde GestionarMicroempresas');
        navigate('/bienvenida', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, usuario, navigate]);

  // Cargar microempresa y productos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [microempresaRes, productosRes] = await Promise.all([
          axios.get('http://localhost:5000/api/microempresas/mi-microempresa', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/productos/mis-productos', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        console.log('Microempresa cargada:', microempresaRes.data.microempresa);
        console.log('Productos cargados:', productosRes.data.productos);
        setMicroempresa(microempresaRes.data.microempresa);
        setProductos(productosRes.data.productos);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar datos');
        console.error('Error al cargar datos:', err);
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
        }
      }
    };
    if (isAuthenticated && !isLoading) {
      fetchData();
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Escuchar eventos WebSocket
  useEffect(() => {
    if (socket) {
      socket.on('productoActualizado', (producto) => {
        setProductos((prev) =>
          prev.map((p) => (p.id === producto.id ? { ...p, ...producto } : p))
        );
      });

      socket.on('productoEliminado', ({ id }) => {
        setProductos((prev) => prev.filter((p) => p.id !== id));
      });

      return () => {
        socket.off('productoActualizado');
        socket.off('productoEliminado');
      };
    }
  }, [socket]);

  const manejarInputChange = (e, index = null) => {
    const { name, value, files } = e.target;
    if (name === 'imagen' && files[0]) {
      const file = files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten imágenes en formato .jpg, .jpeg, .png o .webp');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo excede el límite de 5MB');
        return;
      }
      setProductoForm((prev) => ({ ...prev, imagen: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (index !== null) {
      const newAtributos = [...productoForm.atributos];
      newAtributos[index][name] = value;
      setProductoForm((prev) => ({ ...prev, atributos: newAtributos }));
    } else {
      setProductoForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const agregarAtributo = () => {
    setProductoForm((prev) => ({
      ...prev,
      atributos: [...prev.atributos, { clave: '', valor: '' }],
    }));
  };

  const eliminarAtributo = (index) => {
    setProductoForm((prev) => ({
      ...prev,
      atributos: prev.atributos.filter((_, i) => i !== index),
    }));
  };

  const validarFormulario = () => {
    if (!productoForm.nombre.trim()) {
      return 'El nombre del producto es obligatorio';
    }
    if (productoForm.stock === '' || isNaN(productoForm.stock) || parseInt(productoForm.stock) < 0) {
      return 'El stock debe ser un número entero no negativo';
    }
    if (productoForm.precio === '' || isNaN(productoForm.precio) || parseFloat(productoForm.precio) < 0) {
      return 'El precio debe ser un número no negativo';
    }
    const validAtributos = productoForm.atributos.filter(attr => attr.clave.trim() && attr.valor.trim());
    for (const attr of validAtributos) {
      if (attr.clave.length > 50 || attr.valor.length > 100) {
        return 'La clave no puede exceder 50 caracteres y el valor 100 caracteres';
      }
    }
    return null;
  };

  const manejarAgregarProducto = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const validationError = validarFormulario();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nombre', productoForm.nombre);
      formData.append('descripcion', productoForm.descripcion);
      if (productoForm.imagen) {
        formData.append('imagen', productoForm.imagen);
      }
      formData.append('stock', productoForm.stock);
      formData.append('precio', productoForm.precio);
      const validAtributos = productoForm.atributos.filter(attr => attr.clave.trim() && attr.valor.trim());
      formData.append('atributos', JSON.stringify(validAtributos));

      const response = await axios.post('http://localhost:5000/api/microempresas/productos', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMensaje('Producto agregado con éxito');
      setProductoForm({
        nombre: '',
        descripcion: '',
        imagen: null,
        stock: '',
        precio: '',
        atributos: [{ clave: '', valor: '' }],
      });
      setImagePreview(null);
    } catch (err) {
      const errorMessage = err.response?.data?.errors?.map(e => e.msg).join(', ') || err.response?.data?.error || 'Error al agregar producto';
      setError(errorMessage);
      console.error('Error al agregar producto:', err);
      if (err.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    }
  };

  const manejarEdicion = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const validationError = validarFormulario();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nombre', productoForm.nombre);
      formData.append('descripcion', productoForm.descripcion);
      if (productoForm.imagen) {
        formData.append('imagen', productoForm.imagen);
      }
      formData.append('stock', productoForm.stock);
      formData.append('precio', productoForm.precio);
      const validAtributos = productoForm.atributos.filter(attr => attr.clave.trim() && attr.valor.trim());
      formData.append('atributos', JSON.stringify(validAtributos));

      await axios.put(`http://localhost:5000/api/productos/${productoEditando.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMensaje('Producto actualizado con éxito');
      setProductoEditando(null);
      setProductoForm({
        nombre: '',
        descripcion: '',
        imagen: null,
        stock: '',
        precio: '',
        atributos: [{ clave: '', valor: '' }],
      });
      setImagePreview(null);
    } catch (err) {
      const errorMessage = err.response?.data?.errors?.map(e => e.msg).join(', ') || err.response?.data?.error || 'Error al actualizar producto';
      setError(errorMessage);
      console.error('Error al actualizar producto:', err);
      if (err.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    }
  };

  const manejarEliminacion = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }
    setMensaje('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMensaje('Producto eliminado con éxito');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar producto';
      setError(errorMessage);
      console.error('Error al eliminar producto:', err);
      if (err.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    }
  };

  const iniciarEdicion = (producto) => {
    setProductoEditando(producto);
    setProductoForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      imagen: null,
      stock: producto.stock.toString(),
      precio: producto.precio.toString(),
      atributos: producto.atributos.length > 0 ? producto.atributos : [{ clave: '', valor: '' }],
    });
    setImagePreview(producto.imagen ? `http://localhost:5000${producto.imagen}` : null);
  };

  if (isLoading || !microempresa) {
    return <div className="container mx-auto p-4">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Gestionar Microempresa: {microempresa.nombre}</h2>
      {mensaje && <p className="text-green-500">{mensaje}</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Formulario para agregar/editar producto */}
      <h3 className="text-lg font-semibold mb-2">{productoEditando ? 'Editar Producto' : 'Agregar Producto'}</h3>
      <form onSubmit={productoEditando ? manejarEdicion : manejarAgregarProducto} className="mb-8 max-w-md">
        <div className="mb-4">
          <label className="block mb-1">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={productoForm.nombre}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Descripción</label>
          <textarea
            name="descripcion"
            value={productoForm.descripcion}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Imagen</label>
          <input
            type="file"
            name="imagen"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Vista previa" className="w-32 h-32 object-cover mt-2" />
          )}
        </div>
        <div className="mb-4">
          <label className="block mb-1">Stock</label>
          <input
            type="number"
            name="stock"
            value={productoForm.stock}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            required
            min="0"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Precio</label>
          <input
            type="number"
            name="precio"
            value={productoForm.precio}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Atributos</label>
          {productoForm.atributos.map((atributo, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                name="clave"
                value={atributo.clave}
                onChange={(e) => manejarInputChange(e, index)}
                placeholder="Clave (ej. Talla)"
                className="w-1/2 p-2 border rounded mr-2"
              />
              <input
                type="text"
                name="valor"
                value={atributo.valor}
                onChange={(e) => manejarInputChange(e, index)}
                placeholder="Valor (ej. M)"
                className="w-1/2 p-2 border rounded mr-2"
              />
              <button
                type="button"
                onClick={() => eliminarAtributo(index)}
                className="bg-red-500 text-white p-2 rounded"
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={agregarAtributo}
            className="bg-green-500 text-white p-2 rounded"
          >
            Agregar Atributo
          </button>
        </div>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          {productoEditando ? 'Guardar Cambios' : 'Agregar Producto'}
        </button>
        {productoEditando && (
          <button
            type="button"
            onClick={() => {
              setProductoEditando(null);
              setProductoForm({
                nombre: '',
                descripcion: '',
                imagen: null,
                stock: '',
                precio: '',
                atributos: [{ clave: '', valor: '' }],
              });
              setImagePreview(null);
            }}
            className="bg-gray-500 text-white p-2 rounded ml-2"
          >
            Cancelar
          </button>
        )}
      </form>

      {/* Lista de productos */}
      <h3 className="text-lg font-semibold mb-2">Mis Productos</h3>
      {productos.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <ul className="space-y-4">
          {productos.map((producto) => (
            <li key={producto.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold">{producto.nombre}</h4>
                <p>{producto.descripcion || 'Sin descripción'}</p>
                {producto.imagen && (
                  <img
                    src={`http://localhost:5000${producto.imagen}`}
                    alt={producto.nombre}
                    className="w-32 h-32 object-cover mt-2"
                  />
                )}
                <p>Stock: {producto.stock}</p>
                <p>Precio: ${producto.precio}</p>
                {producto.atributos.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Atributos:</p>
                    <ul>
                      {producto.atributos.map((attr, index) => (
                        <li key={index}>{attr.clave}: {attr.valor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => iniciarEdicion(producto)}
                  className="bg-yellow-500 text-white p-2 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => manejarEliminacion(producto.id)}
                  className="bg-red-500 text-white p-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GestionarMicroempresas;
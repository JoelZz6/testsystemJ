import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

function AdminMicroempresas() {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    nombre_base_datos: '',
    tipo: 'base_datos',
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario es administrador
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.rol !== 'administrador') {
        navigate('/bienvenida');
      }
    } catch (err) {
      console.error('Error al decodificar token:', err);
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const manejarCrearMicroempresa = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setIsLoading(true);

    // Sanitizar nombre_base_datos en el frontend
    const sanitizedNombreBaseDatos = formData.nombre_base_datos
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    const dataToSend = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      nombre_base_datos: sanitizedNombreBaseDatos,
      tipo: formData.tipo,
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/microempresas', dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMensaje('Microempresa creada con éxito');
      setFormData({ nombre: '', descripcion: '', nombre_base_datos: '', tipo: 'base_datos' });
      setTimeout(() => {
        navigate('/admin/listar-microempresas');
      }, 1000);
    } catch (err) {
      let errorMsg = 'Error al crear microempresa';
      if (err.response?.data?.errors) {
        errorMsg = err.response.data.errors.map((e) => e.msg).join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
      console.error('Error:', err.response || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Crear Microempresa</h2>
      {mensaje && <p className="text-green-500 mb-4">{mensaje}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={manejarCrearMicroempresa}>
        <div className="mb-4">
          <label className="block mb-1">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            maxLength="100"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            maxLength="500"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Nombre de Base de Datos o Esquema</label>
          <input
            type="text"
            name="nombre_base_datos"
            value={formData.nombre_base_datos}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            maxLength="50"
            pattern="[a-z0-9_]+"
            title="Solo letras minúsculas, números y guiones bajos"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tipo</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
            disabled={isLoading}
          >
            <option value="base_datos">Base de Datos</option>
            <option value="esquema">Esquema</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Creando...' : 'Crear Microempresa'}
        </button>
      </form>
    </div>
  );
}

export default AdminMicroempresas;
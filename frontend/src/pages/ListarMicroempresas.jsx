import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

function ListarMicroempresas() {
  const [microempresas, setMicroempresas] = useState([]);
  const [comerciantes, setComerciantes] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [microempresaEditando, setMicroempresaEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', nombre_base_datos: '', usuario_id: '' });
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

  // Cargar microempresas
  useEffect(() => {
    const fetchMicroempresas = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/microempresas', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMicroempresas(response.data.microempresas);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar microempresas');
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      }
    };
    fetchMicroempresas();
  }, [navigate]);

  // Cargar comerciantes al abrir el modal
  useEffect(() => {
    if (microempresaEditando) {
      const fetchComerciantes = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:5000/api/usuarios/comerciantes', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setComerciantes(response.data.comerciantes);
        } catch (err) {
          setError(err.response?.data?.error || 'Error al cargar comerciantes');
          console.error('Error:', err.response || err);
        }
      };
      fetchComerciantes();
    }
  }, [microempresaEditando]);

  const iniciarEdicion = (microempresa) => {
    setMicroempresaEditando(microempresa);
    setFormData({
      nombre: microempresa.nombre,
      descripcion: microempresa.descripcion || '',
      nombre_base_datos: microempresa.base_datos.replace(/^me_/, ''),
      usuario_id: microempresa.comerciante_id || '',
    });
  };

  const cerrarModal = () => {
    setMicroempresaEditando(null);
    setFormData({ nombre: '', descripcion: '', nombre_base_datos: '', usuario_id: '' });
    setComerciantes([]);
    setError('');
    setMensaje('');
  };

  const manejarInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const manejarEdicion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        nombre_base_datos: formData.nombre_base_datos,
        usuario_id: formData.usuario_id === '' ? null : Number(formData.usuario_id),
      };
      const response = await axios.put(
        `http://localhost:5000/api/microempresas/${microempresaEditando.id}`,
        dataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMicroempresas((prev) =>
        prev.map((m) =>
          m.id === microempresaEditando.id
            ? {
                ...m,
                ...response.data.microempresa,
                base_datos: response.data.microempresa.base_datos,
                tipo: response.data.microempresa.tipo,
                comerciante_id: response.data.microempresa.comerciante_id,
                comerciante_nombre: response.data.microempresa.comerciante_nombre,
              }
            : m
        )
      );
      setMensaje('Microempresa actualizada con éxito');
      setTimeout(cerrarModal, 2000);
    } catch (err) {
      let errorMsg = 'Error al actualizar microempresa';
      if (err.response?.data?.errors) {
        errorMsg = err.response.data.errors.map((e) => e.msg).join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const manejarEliminacion = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta microempresa? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/microempresas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMicroempresas((prev) => prev.filter((m) => m.id !== id));
      setMensaje('Microempresa eliminada con éxito');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar microempresa');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Listar Microempresas</h2>
      {mensaje && <p className="text-green-500">{mensaje}</p>}
      {error && <p className="text-red-500">{error}</p>}
      {microempresas.length === 0 ? (
        <p>No hay microempresas registradas.</p>
      ) : (
        <ul className="space-y-4">
          {microempresas.map((microempresa) => (
            <li key={microempresa.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{microempresa.nombre}</h3>
                <p>{microempresa.descripcion || 'Sin descripción'}</p>
                <p className="text-sm text-gray-600">Base de datos/Esquema: {microempresa.base_datos}</p>
                <p className="text-sm text-gray-600">Tipo: {microempresa.tipo === 'base_datos' ? 'Base de Datos' : 'Esquema'}</p>
                <p className="text-sm text-gray-600">
                  Comerciante: {microempresa.comerciante_nombre || 'Sin comerciante'}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => iniciarEdicion(microempresa)}
                  className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => manejarEliminacion(microempresa.id)}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal para editar */}
      {microempresaEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Editar Microempresa</h3>
            {mensaje && <p className="text-green-500">{mensaje}</p>}
            {error && <p className="text-red-500">{error}</p>}
            <form onSubmit={manejarEdicion}>
              <div className="mb-4">
                <label className="block mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={manejarInputChange}
                  className="w-full p-2 border rounded"
                  maxLength="100"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={manejarInputChange}
                  className="w-full p-2 border rounded"
                  rows="4"
                  maxLength="500"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Nombre de Base de Datos o Esquema</label>
                <input
                  type="text"
                  name="nombre_base_datos"
                  value={formData.nombre_base_datos}
                  onChange={manejarInputChange}
                  className="w-full p-2 border rounded"
                  maxLength="50"
                  pattern="[a-z0-9_]+"
                  title="Solo letras minúsculas, números y guiones bajos"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Comerciante</label>
                <select
                  name="usuario_id"
                  value={formData.usuario_id}
                  onChange={manejarInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Sin comerciante</option>
                  {comerciantes.map((comerciante) => (
                    <option key={comerciante.id} value={comerciante.id}>
                      {comerciante.nombre_usuario}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListarMicroempresas;
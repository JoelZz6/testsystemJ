import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

function CambiarRol() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [rol, setRol] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
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
      navigate('/login');
    }
  }, [navigate]);

  // Cargar usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/usuarios', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsuarios(response.data.usuarios);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar usuarios');
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      }
    };
    fetchUsuarios();
  }, [navigate]);

  const manejarCambioRol = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/usuarios/cambiar-rol',
        { usuario_id: parseInt(usuarioId), rol },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensaje('Rol cambiado con éxito');
      setUsuarioId('');
      setRol('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar rol');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Cambiar Rol de Usuario</h2>
      {mensaje && <p className="text-green-500">{mensaje}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={manejarCambioRol} className="max-w-md">
        <div className="mb-4">
          <label className="block mb-1">Usuario</label>
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Selecciona un usuario</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre_usuario} ({usuario.rol})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Nuevo Rol</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Selecciona un rol</option>
            <option value="administrador">Administrador</option>
            <option value="comerciante">Comerciante</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Cambiar Rol
        </button>
      </form>
    </div>
  );
}

export default CambiarRol;
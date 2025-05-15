import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

function Perfil() {
  const { usuario, isAuthenticated, isLoading } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo: '',
    contrasena_actual: '',
    nueva_contrasena: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  console.log('Perfil - Estado:', { isAuthenticated, isLoading, usuario });

  // Redirigir si no está autenticado y la verificación ha terminado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Redirigiendo a /login desde Perfil');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Cargar datos del perfil
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/perfil', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPerfil(response.data.perfil);
        setFormData({
          nombre_usuario: response.data.perfil.nombre_usuario,
          correo: response.data.perfil.correo,
          contrasena_actual: '',
          nueva_contrasena: '',
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar perfil');
        console.error('Error al cargar perfil:', err);
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
        }
      }
    };
    if (isAuthenticated && !isLoading) {
      fetchPerfil();
    }
  }, [isAuthenticated, isLoading, navigate]);

  const manejarInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const manejarActualizacion = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        nombre_usuario: formData.nombre_usuario !== perfil.nombre_usuario ? formData.nombre_usuario : undefined,
        correo: formData.correo !== perfil.correo ? formData.correo : undefined,
        contrasena_actual: formData.contrasena_actual,
        nueva_contrasena: formData.nueva_contrasena || undefined,
      };
      const response = await axios.put('http://localhost:5000/api/perfil', dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPerfil(response.data.perfil);
      setMensaje('Perfil actualizado con éxito');
      setFormData((prev) => ({
        ...prev,
        contrasena_actual: '',
        nueva_contrasena: '',
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar perfil');
      console.error('Error al actualizar perfil:', err);
      if (err.response?.status === 401) {
        navigate('/login', { replace: true });
      }
    }
  };

  if (isLoading || !perfil) {
    return <div className="container mx-auto p-4">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Mi Perfil</h2>
      {mensaje && <p className="text-green-500">{mensaje}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Información Actual</h3>
        <p><strong>Nombre de usuario:</strong> {perfil.nombre_usuario}</p>
        <p><strong>Correo:</strong> {perfil.correo}</p>
        <p><strong>Rol:</strong> {perfil.rol}</p>
      </div>
      <h3 className="text-lg font-semibold mb-2">Editar Perfil</h3>
      <form onSubmit={manejarActualizacion} className="max-w-md">
        <div className="mb-4">
          <label className="block mb-1">Nombre de usuario</label>
          <input
            type="text"
            name="nombre_usuario"
            value={formData.nombre_usuario}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Correo</label>
          <input
            type="email"
            name="correo"
            value={formData.correo}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Nueva contraseña (opcional)</label>
          <input
            type="password"
            name="nueva_contrasena"
            value={formData.nueva_contrasena}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            placeholder="Dejar en blanco si no desea cambiar"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Contraseña actual (obligatoria)</label>
          <input
            type="password"
            name="contrasena_actual"
            value={formData.contrasena_actual}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Actualizar Perfil
        </button>
      </form>
    </div>
  );
}

export default Perfil;
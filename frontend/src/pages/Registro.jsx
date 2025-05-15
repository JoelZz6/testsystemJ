import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Registro() {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo: '',
    contrasena: '',
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const manejarInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setIsLoading(true);

    console.log('Enviando datos de registro:', formData);

    try {
      const response = await axios.post('http://localhost:5000/api/usuarios/registrar', formData);
      console.log('Respuesta del servidor:', response.data);

      const { token } = response.data;
      localStorage.setItem('token', token);
      setMensaje('Registro exitoso. Redirigiendo...');

      // Redirigir a /bienvenida después de 1 segundo
      setTimeout(() => {
        navigate('/bienvenida', { replace: true });
      }, 1000);
    } catch (err) {
      let errorMsg = 'Error al registrar usuario';
      if (err.response?.data?.errors) {
        // Mostrar los mensajes de error de validación del servidor
        errorMsg = err.response.data.errors.map((e) => e.msg).join(', ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
      console.error('Error en registro:', err.response || err);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Registrarse</h2>
      {mensaje && <p className="text-green-500 mb-4">{mensaje}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={manejarRegistro}>
        <div className="mb-4">
          <label className="block mb-1">Nombre de usuario</label>
          <input
            type="text"
            name="nombre_usuario"
            value={formData.nombre_usuario}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            required
            maxLength="50"
            disabled={isLoading}
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
            required
            maxLength="100"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Contraseña</label>
          <input
            type="password"
            name="contrasena"
            value={formData.contrasena}
            onChange={manejarInputChange}
            className="w-full p-2 border rounded"
            required
            minLength="8"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">La contraseña debe tener al menos 8 caracteres.</p>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}

export default Registro;  
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/usuarios/login', {
        correo,
        contrasena,
      });

      const { token } = response.data;
      localStorage.setItem('token', token);
      console.log('Token almacenado:', token);

      // Esperar brevemente para que useAuth verifique el token
      setTimeout(() => {
        navigate('/bienvenida', { replace: true });
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      console.error('Error en login:', err);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={manejarSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full p-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Contraseña</label>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full p-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded w-full"
          disabled={isLoading}
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}

export default Login;
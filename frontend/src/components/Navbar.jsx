import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Sistema de la Feria
        </Link>
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div className={`md:flex items-center space-x-4 ${isOpen ? 'block' : 'hidden'} md:block`}>
          {usuario ? (
            <>
              <Link to="/bienvenida" className="hover:underline">
                Productos
              </Link>
              {usuario.rol === 'administrador' && (
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                  <Link to="/admin/microempresas" className="hover:underline">
                    Crear Microempresa
                  </Link>
                  <Link to="/admin/listar-microempresas" className="hover:underline">
                    Listar Microempresas
                  </Link>
                  <Link to="/admin/cambiar-rol" className="hover:underline">
                    Cambiar Rol
                  </Link>
                </div>
              )}
              {usuario?.rol === 'comerciante' && (
                <Link to="/gestionar-microempresa" className="hover:underline">
                  Gestionar Microempresa
                </Link>
              )}
              <Link to="/perfil" className="hover:underline">
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Iniciar Sesión
              </Link>
              <Link to="/registro" className="hover:underline">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
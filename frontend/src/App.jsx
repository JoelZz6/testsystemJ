import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Registro from './pages/Registro';
import Login from './pages/Login';
import Bienvenida from './pages/Bienvenida';
import AdminMicroempresas from './pages/AdminMicroempresas';
import GestionarMicroempresas from './pages/GestionarMicroempresas';
import ListarMicroempresas from './pages/ListarMicroempresas';
import CambiarRol from './pages/CambiarRol';
import Perfil from './pages/Perfil';
import { SocketProvider } from './SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Bienvenida />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/bienvenida" element={<Bienvenida />} />
          <Route path="/admin/microempresas" element={<AdminMicroempresas />} />
          <Route path="/gestionar-microempresa" element={<GestionarMicroempresas />} />
          <Route path="/admin/listar-microempresas" element={<ListarMicroempresas />} />
          <Route path="/admin/cambiar-rol" element={<CambiarRol />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
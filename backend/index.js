const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const usuarioRoutes = require('./routes/usuarios');
const microempresasRoutes = require('./routes/microempresas');
const productosRoutes = require('./routes/productos');
const authRoutes = require('./routes/auth');
const perfilRoutes = require('./routes/perfil');
const path = require('path'); // Agregar path

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.set('socketio', io);

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/microempresas', microempresasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/perfil', perfilRoutes);

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Servidor corriendo en el puerto 5000');
  console.log('Servidor WebSocket listo para conexiones');
});
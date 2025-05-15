import { createContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['polling', 'websocket'], // Priorizar polling como respaldo
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // Aumentar el tiempo de espera a 10 segundos
    });

    socketInstance.on('connect', () => {
      console.log('Conectado al servidor WebSocket:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('Error de conexión WebSocket, reintentando:', error.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('Fallo al reconectar al servidor WebSocket');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
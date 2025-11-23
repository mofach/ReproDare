/* eslint-disable react-hooks/refs */
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

// Cek URL: Pastikan ini mengarah ke backend Anda (misal http://localhost:4000)
// Hati-hati: Vite defaultnya port 5173, Backend biasanya 3000 atau 4000.
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'; // Sesuaikan port backend Anda

export const useSocket = () => {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // DEBUG 1: Cek apakah token ada
    console.log("[useSocket] Hook running. Token exists?", !!token);
    console.log("[useSocket] Target URL:", SOCKET_URL);

    if (!token) {
      console.warn("[useSocket] Token missing, skipping connection.");
      return;
    }

    // Inisialisasi koneksi
    const socket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnectionAttempts: 5,
      autoConnect: true,
      transports: ['websocket', 'polling'] // Paksa coba dua-duanya
    });

    socket.on('connect', () => {
      console.log('✅ [Frontend] Socket Connected! ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.warn('❌ [Frontend] Socket Disconnected. Reason:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('🔥 [Frontend] Connection Error:', err.message);
      // Ini sering terjadi jika auth di backend menolak token
    });

    socketRef.current = socket;

    return () => {
      console.log("[useSocket] Cleanup/Unmount");
      socket.disconnect();
    };
  }, [token]);

  return { socket: socketRef.current, isConnected };
};
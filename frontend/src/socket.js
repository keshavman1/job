// frontend/src/socket.js
import { io } from "socket.io-client";

// Vite exposes env vars via import.meta.env and they should be prefixed with VITE_
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export const socket = io(SOCKET_URL, { autoConnect: true, withCredentials: true });

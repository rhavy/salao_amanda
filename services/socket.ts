import { io, Socket } from "socket.io-client";
import { BASE_URL } from "./api"; // Reutiliza a URL dinâmica

let socket: Socket;

export const initSocket = () => {
    if (!socket) {
        // Conecta ao backend
        socket = io(BASE_URL, {
            transports: ['websocket'], // Forçar websocket para melhor performance
            autoConnect: false
        });

        console.log("🔌 Socket inicializado em:", BASE_URL);
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};

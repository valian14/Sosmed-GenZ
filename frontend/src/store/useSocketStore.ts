import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface SocketState {
    socket: Socket | null;
    setSocket: (socket: Socket | null) => void;
    onlineUsers: string[];
    setOnlineUsers: (users: string[]) => void;
    addOnlineUser: (userId: string) => void;
    removeOnlineUser: (userId: string) => void;
}

const useSocketStore = create<SocketState>((set) => ({
    socket: null,
    setSocket: (socket) => set({ socket }),
    onlineUsers: [],
    setOnlineUsers: (users) => set({ onlineUsers: users }),
    addOnlineUser: (userId) => set((state) => ({
        onlineUsers: state.onlineUsers.includes(userId) ? state.onlineUsers : [...state.onlineUsers, userId]
    })),
    removeOnlineUser: (userId) => set((state) => ({
        onlineUsers: state.onlineUsers.filter(id => id !== userId)
    })),
}));

export default useSocketStore;

"use client";

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuthStore from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import useSocketStore from '@/store/useSocketStore';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const { accessToken, user } = useAuthStore();
    const { setSocket } = useSocketStore();
    const { toast } = useToast();

    useEffect(() => {
        if (!accessToken || !user) return;

        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
            auth: { token: accessToken }
        });

        const socket = socketRef.current;
        setSocket(socket);

        socket.on('connect', () => {
            console.log('Connected to realtime server');
        });

        socket.on('new_notification', (data) => {
            toast({
                title: 'New Notification',
                description: data.message,
            });
        });

        socket.on('user_online', (userId) => {
            // update user status
        });

        return () => {
            socket.disconnect();
        };
    }, [accessToken, user, toast]);

    return socketRef.current;
};

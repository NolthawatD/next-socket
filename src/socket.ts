"use client";

import { io } from "socket.io-client";

// Define types
export interface PrivateMessage {
  recipient: string;
  message: string;
}

export interface ReceivedMessage {
  from: string;
  message: string;
}

// Only initialize socket on the client side
let socket: any;

// Function to initialize socket with userId
export const initSocket = (userId?: string) => {
  if (typeof window !== "undefined" && !socket) {
    const query = userId ? { userId } : {};
    socket = io({
      query
    });
    return socket;
  }
  return socket;
};

// Initialize with no userId by default (for backward compatibility)
if (typeof window !== "undefined") {
  socket = io();
}

// Add a helper function to send messages
export const sendMessage = (recipient: string, message: string): void => {
  socket?.emit("private-message", { recipient, message });
};

export { socket };
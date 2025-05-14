"use client";

import { io } from "socket.io-client";

// Only initialize socket on the client side
let socket: any;

// This will only execute on the client
if (typeof window !== "undefined") {
  socket = io();
}

// Define types
export interface PrivateMessage {
  recipient: string;
  message: string;
}

export interface ReceivedMessage {
  from: string;
  message: string;
}

// Add a helper function to send messages
export const sendMessage = (recipient: string, message: string): void => {
  socket?.emit("private-message", { recipient, message });
};

export { socket };
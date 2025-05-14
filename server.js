import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Track connected users
const connectedUsers = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);
  
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Add user to connected users map
    connectedUsers.set(socket.id, {
      id: socket.id,
      name: `User ${connectedUsers.size + 1}` // Simple naming convention
    });
    
    // Broadcast updated user list to everyone
    io.emit("users-updated", Array.from(connectedUsers.values()));
    
    // Handle private messages
    socket.on("private-message", ({ recipient, message }) => {
      console.log(`Message from ${socket.id} to ${recipient}: ${message}`);
      io.to(recipient).emit("private-message", {
        from: socket.id,
        message
      });
    });
    
    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      connectedUsers.delete(socket.id);
      io.emit("users-updated", Array.from(connectedUsers.values()));
    });
  });
  
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
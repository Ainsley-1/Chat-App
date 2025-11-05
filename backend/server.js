const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Data stores
const activeUsers = new Map();
const chatMessages = new Map();
const privateMessages = new Map();
const userTyping = new Map();
const chatRooms = new Set(["general", "random", "help"]);

// Initialize rooms
chatRooms.forEach(room => {
  chatMessages.set(room, []);
});

// ... (ALL YOUR EXISTING SOCKET.IO CODE GOES HERE)
// Keep all the socket event handlers and functionality

// Dynamic port selection
function findAvailablePort(startPort = 3001, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    let port = startPort;
    let attempts = 0;

    function tryPort() {
      if (attempts >= maxAttempts) {
        reject(new Error('No available ports found'));
        return;
      }

      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => {
          resolve(port);
        });
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          port++;
          tryPort();
        } else {
          reject(err);
        }
      });
    }

    tryPort();
  });
}

// Start server with dynamic port
findAvailablePort()
  .then(port => {
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📱 Frontend should connect to: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to start server:', err);
  });

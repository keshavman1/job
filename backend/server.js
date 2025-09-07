// backend/server.js
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dotenv from "dotenv";
import dbConnection from "./database/dbConnection.js";

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// attach io to app so controllers can use req.app.get("io")
app.set("io", io);

// Map userId -> socketId (simple single-socket mapping)
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // frontend should call: socket.emit('register', userId)
  socket.on("register", (userId) => {
    if (!userId) return;
    userSockets.set(String(userId), socket.id);
    socket.join(String(userId)); // join room named by userId
    console.log("Registered socket for user:", userId, socket.id);
  });

  // Optional: support socket-based send-message (client may prefer HTTP)
  socket.on("send-message", async ({ to, from, content }) => {
    if (!to || !from || !content) return;
    // emit to recipient room
    io.to(String(to)).emit("receive-message", { from, to, content, createdAt: new Date() });
    // echo back to sender's socket(s)
    io.to(String(from)).emit("message-sent", { from, to, content, createdAt: new Date() });
  });

  socket.on("disconnect", () => {
    // remove mapping(s) for this socket id
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) userSockets.delete(uid);
    }
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
dbConnection(); // ensure DB connected
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

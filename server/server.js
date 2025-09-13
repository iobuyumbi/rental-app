const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require("./routes/users");
const inventoryRoutes = require("./routes/inventory");
const orderRoutes = require("./routes/orders");
const casualRoutes = require("./routes/casuals");
const transactionRoutes = require("./routes/transactions");
const reportRoutes = require("./routes/reports");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();

// Connect to database
connectDB();

// Middleware - CORS configuration for development
const corsOptions = {
  origin: true, // Allow all origins during development
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'x-cache-max-age', 'x-offline-key'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/casuals", casualRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Rental App API is running" });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = require("http").createServer(app);

// Initialize Socket.IO
const io = require("socket.io")(server, {
  cors: {
    origin: true, // Allow all origins during development
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  // You can add JWT verification here if needed
  next();
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle joining rooms
  socket.on("join_room", ({ room }) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Handle leaving rooms
  socket.on("leave_room", ({ room }) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
  });

  // Handle typing indicators
  socket.on("typing_start", ({ room }) => {
    socket.to(room).emit("user_typing", { userId: socket.id, typing: true });
  });

  socket.on("typing_stop", ({ room }) => {
    socket.to(room).emit("user_typing", { userId: socket.id, typing: false });
  });

  // Handle status updates
  socket.on("status_update", ({ status }) => {
    // Broadcast to all connected clients except sender
    socket.broadcast.emit("user_status", { userId: socket.id, status });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Broadcast to all that this user is offline
    socket.broadcast.emit("user_offline", { id: socket.id });
  });
});

// Start server with Socket.IO
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

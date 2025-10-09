const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Log environment variables for debugging
console.log('🔧 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'not set');

// Import routes
const userRoutes = require("./routes/usersRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const workerRoutes = require("./routes/workersRoutes");
const clientRoutes = require("./routes/clientRoutes");
const transactionRoutes = require("./routes/transactionsRoutes");
const reportRoutes = require("./routes/reportsRoutes");
const taskRateRoutes = require("./routes/taskRateRoutes");
const taskCompletionRoutes = require("./routes/taskCompletionRoutes");
const lunchAllowanceRoutes = require("./routes/lunchAllowanceRoutes");
const workerTaskRoutes = require("./routes/workerTaskRoutes");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();

// Connect to database
console.log('🔌 Attempting to connect to database...');
connectDB().then(() => {
  console.log('✅ Database connection successful');
}).catch((error) => {
  console.error('❌ Database connection failed:', error.message);
});

// Middleware - CORS configuration for development
const parsedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

console.log('✅ Allowed CORS origins:', parsedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (parsedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'x-cache-max-age', 'x-offline-key'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Security middleware
app.use(helmet());
app.use(compression());

// CORS and body parsing
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/task-rates", taskRateRoutes);
app.use("/api/task-completions", taskCompletionRoutes);
app.use("/api/lunch-allowances", lunchAllowanceRoutes);
app.use("/api/worker-tasks", workerTaskRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Rental App API is running" });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
}).on('error', (error) => {
  console.error('❌ Server startup error:', error.message);
  process.exit(1);
});

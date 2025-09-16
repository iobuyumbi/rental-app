const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require("./routes/usersRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const orderRoutes = require("./routes/ordersRoutes");
const workerRoutes = require("./routes/workersRoutes");
const clientRoutes = require("./routes/clientRoutes");
const transactionRoutes = require("./routes/transactionsRoutes");
const reportRoutes = require("./routes/reportsRoutes");
const taskRateRoutes = require("./routes/taskRateRoutes");
const taskCompletionRoutes = require("./routes/taskCompletionRoutes");
const lunchAllowanceRoutes = require("./routes/lunchAllowanceRoutes");

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
app.use("/api/workers", workerRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/task-rates", taskRateRoutes);
app.use("/api/task-completions", taskCompletionRoutes);
app.use("/api/lunch-allowances", lunchAllowanceRoutes);

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
  console.log(`Server running on port ${PORT}`);
});

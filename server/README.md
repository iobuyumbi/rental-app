# Rental App Backend

This is the Express.js backend for the rental management application.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file in the server directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/rental-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

3. Make sure MongoDB is running on your system.

4. Start the development server:
```bash
pnpm run dev
```

## API Endpoints

### Authentication
- `POST /api/users/login` - Login user
- `POST /api/users/register` - Register new user (Admin only)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Inventory Management
- `GET /api/inventory/categories` - Get all categories
- `POST /api/inventory/categories` - Add new category
- `GET /api/inventory/products` - Get all products
- `POST /api/inventory/products` - Add new product
- `PUT /api/inventory/products/:id` - Update product
- `DELETE /api/inventory/products/:id` - Delete product

### Order Management
- `GET /api/orders/clients` - Get all clients
- `POST /api/orders/clients` - Add new client
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/return` - Mark order as returned
- `POST /api/orders/:id/discount/request` - Request discount
- `PUT /api/orders/:id/discount/approve` - Approve discount (Admin only)

### Casual Workers
- `GET /api/casuals/workers` - Get all workers
- `POST /api/casuals/workers` - Add new worker
- `POST /api/casuals/attendance` - Record attendance
- `GET /api/casuals/:id/remuneration` - Calculate remuneration

### Transactions
- `POST /api/transactions/purchases` - Record purchase
- `POST /api/transactions/repairs` - Record repair
- `PUT /api/transactions/repairs/:id` - Update repair status

### Reports
- `GET /api/reports/invoices/:orderId` - Generate invoice
- `GET /api/reports/receipts/:orderId` - Generate receipt
- `GET /api/reports/inventory-status` - Get inventory status
- `GET /api/reports/overdue-returns` - Get overdue returns 
# Rental Management System

A comprehensive rental management application built with Express.js backend and React frontend, designed for managing rental operations, inventory, orders, workers, and financial transactions.

## 🚀 Features

### Backend (Express.js + MongoDB)
- **User Management**: JWT authentication with role-based access control
- **Inventory Management**: Product categories, stock tracking, condition monitoring
- **Order Management**: Complete order lifecycle from creation to return
- **Client Management**: Customer information and order history
- **Worker Management**: Worker attendance, task tracking, and payment calculation
- **Lunch Allowance**: Automated lunch allowance tracking for workers
- **Transaction Management**: Purchase and repair tracking with financial reporting
- **Violation System**: Track and manage rental violations and penalties
- **Task-based Payments**: Configurable rates for different worker tasks

### Frontend (React + Vite + Shadcn UI)
- **Modern UI**: Beautiful, responsive interface using Shadcn UI components
- **Authentication**: Secure login with role-based navigation
- **Dashboard**: Overview statistics and quick actions
- **Inventory Management**: Full CRUD operations for products and categories
- **Order Processing**: Create and manage rental orders with multiple items
- **Worker Management**: Track worker attendance and task completion
- **Financial Tracking**: Monitor transactions, purchases, and repairs
- **Violation Management**: View and resolve rental violations
- **Mobile Responsive**: Works on all device sizes

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Winston** - Logging
- **Helmet** - Security headers

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Form validation
- **Date-fns** - Date manipulation
- **Lucide React** - Icons

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- pnpm (recommended) or npm

### Environment Setup
1. Create `.env` files in both `client` and `server` directories
2. Configure required environment variables (see `.env.example` in each directory)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/rental-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

4. Start the development server:
```bash
pnpm run dev
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## 🗄️ Database Schema

### Core Models
- **User**: Administrators and admin assistants
- **ProductCategory**: Product organization
- **Product**: Rental items with inventory tracking
- **Client**: Customer information
- **Order**: Rental orders with payment tracking
- **OrderItem**: Individual items within orders
- **Violation**: Order violations and penalties
- **CasualWorker**: Worker information and rates
- **CasualAttendance**: Daily attendance and activities
- **Purchase**: Inventory purchases
- **Repair**: Item repairs and maintenance

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access, user management, discount approval
- **Admin Assistant**: Limited access, order management, inventory operations

### JWT Implementation
- Secure token-based authentication
- Automatic token refresh
- Role-based route protection

## 📊 API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration (Admin only)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Inventory
- `GET /api/inventory/categories` - Get product categories
- `POST /api/inventory/categories` - Add category
- `GET /api/inventory/products` - Get products with filters
- `POST /api/inventory/products` - Add product
- `PUT /api/inventory/products/:id` - Update product
- `DELETE /api/inventory/products/:id` - Delete product

### Orders
- `GET /api/orders/clients` - Get clients
- `POST /api/orders/clients` - Add client
- `GET /api/orders` - Get orders with filters
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/return` - Mark order returned
- `POST /api/orders/:id/discount/request` - Request discount
- `PUT /api/orders/:id/discount/approve` - Approve discount (Admin only)

### Casual Workers
- `GET /api/casuals/workers` - Get workers
- `POST /api/casuals/workers` - Add worker
- `POST /api/casuals/attendance` - Record attendance
- `GET /api/casuals/:id/remuneration` - Calculate remuneration

### Reports
- `GET /api/reports/invoices/:orderId` - Generate invoice
- `GET /api/reports/receipts/:orderId` - Generate receipt
- `GET /api/reports/inventory-status` - Get inventory status
- `GET /api/reports/overdue-returns` - Get overdue returns

## 🎨 UI Components

The application uses Shadcn UI components for a consistent and modern design:

- **Cards**: Information display and grouping
- **Tables**: Data presentation
- **Forms**: User input and validation
- **Dialogs**: Modal interactions
- **Navigation**: Sidebar and breadcrumbs
- **Buttons**: Action triggers
- **Badges**: Status indicators

## 🔧 Development

### Project Structure
```
rental-app/
├── server/                 # Backend application
│   ├── config/            # Database configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── index.js          # Server entry point
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React contexts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── hooks/        # Custom hooks
│   └── public/           # Static assets
└── README.md             # Project documentation
```

### Adding New Features

1. **Backend**: Create models, controllers, and routes
2. **Frontend**: Create components and pages
3. **API Integration**: Update services and handle responses
4. **Testing**: Verify functionality and edge cases

### Code Style
- Use consistent naming conventions
- Implement proper error handling
- Add meaningful comments
- Follow RESTful API design principles

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Use a process manager like PM2
3. Configure MongoDB connection
4. Set up SSL certificates

### Frontend Deployment
1. Build the application: `pnpm run build`
2. Deploy to a static hosting service
3. Configure environment variables
4. Set up domain and SSL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Create an issue on GitHub

## 🔮 Future Enhancements

- **Real-time Notifications**: WebSocket integration
- **Mobile App**: React Native version
- **Advanced Analytics**: Business intelligence dashboard
- **Multi-tenant Support**: Multiple rental businesses
- **Payment Integration**: Online payment processing
- **Barcode Scanning**: Inventory management automation
- **Email Notifications**: Automated reminders and reports 
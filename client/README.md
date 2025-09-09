# Rental App Frontend

This is the React frontend for the rental management application built with Vite and Shadcn UI.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file in the client directory with the following variables:
```
VITE_API_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`

## Features

### Authentication
- Login system with JWT tokens
- Role-based access control (Admin/Admin Assistant)
- Protected routes

### Dashboard
- Overview statistics
- Quick access to key features
- Recent activity summary

### Inventory Management
- Product catalog with categories
- Add, edit, and delete products
- Stock tracking
- Condition monitoring

### Order Management (Coming Soon)
- Create and manage rental orders
- Client management
- Payment tracking
- Return processing

### Casual Workers (Coming Soon)
- Worker management
- Attendance tracking
- Remuneration calculation

### Transactions (Coming Soon)
- Purchase recording
- Repair tracking
- Cost management

### Reports (Coming Soon)
- Invoice generation
- Receipt creation
- System reports
- PDF export

### User Management (Admin Only)
- User administration
- Role management
- Permission control

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   └── Layout.jsx      # Main layout component
├── context/            # React contexts
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
├── services/           # API services
│   └── api.js         # API client
└── hooks/              # Custom React hooks
```

## Development

### Adding New Pages
1. Create a new component in `src/pages/`
2. Add the route to `src/App.jsx`
3. Update navigation in `src/components/Layout.jsx` if needed

### API Integration
- Use the API services in `src/services/api.js`
- Handle loading states and errors
- Use toast notifications for user feedback

### Styling
- Use Tailwind CSS classes
- Leverage Shadcn UI components
- Follow the existing design patterns

## Build

To build for production:
```bash
pnpm run build
```

The built files will be in the `dist/` directory.

# Rental Management System - Client

A comprehensive rental management system built with React and modern web technologies.

## Features

### Core Management
- **Inventory Management**: Track products, quantities, and availability
- **Order Management**: Complete order lifecycle from creation to completion
- **Client Management**: Customer database with contact information
- **Worker Management**: Staff tracking and task assignment

### Advanced Features
- **KPI Analytics Dashboard**: Business intelligence with utilization rates and revenue metrics
- **SMS Notifications**: Automated customer notifications and bulk messaging
- **Invoice Generation**: Professional PDF invoices with automatic calculations
- **Security Deposits**: Automated deposit collection and refund system
- **Rating & Review System**: Customer feedback and trust building
- **Flexible Rental Periods**: Hourly, daily, weekly, monthly rentals with automatic discounts
- **Real-time Availability Calendar**: Visual booking management
- **In-app Messaging**: Direct communication with customers
- **Mobile Responsive**: Optimized for all device sizes

### Business Intelligence
- **Real-time Inventory Tracking**: Automatic quantity updates
- **Worker Task Recording**: Comprehensive task tracking and compensation
- **Date Validation**: Dynamic pricing with early/late return handling
- **Utilization Analytics**: Performance metrics and insights

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **UI Components**: Radix UI, Shadcn/ui
- **State Management**: React Context
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Notifications**: Sonner
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Testing
```bash
npm run test
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── calendar/       # Availability calendar
│   ├── deposits/       # Deposit management
│   ├── messaging/      # In-app messaging
│   ├── reviews/        # Rating system
│   ├── rental/         # Rental periods
│   └── ui/            # Base UI components
├── pages/              # Main application pages
├── services/           # API services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── context/            # React context providers
```

## Key Components

- **DepositManager**: Security deposit handling
- **AvailabilityCalendar**: Visual booking calendar
- **ReviewSystem**: Customer feedback management
- **FlexibleRentalPeriods**: Dynamic pricing system
- **MessagingSystem**: Customer communication
- **AnalyticsPage**: Business intelligence dashboard
- **SMSManager**: Notification system
- **InvoiceManager**: PDF invoice generation

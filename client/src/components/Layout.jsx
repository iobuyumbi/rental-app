import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  FileText,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ClipboardList,
  AlertTriangle,
  DollarSign,
  BarChart3,
  MessageSquare,
} from "lucide-react";

// Grouped navigation to declutter sidebar
const Layout = ({ children, fullBleed = false }) => {
  // State for sidebar and dropdowns
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [workersOpen, setWorkersOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const toggleOrders = () => setOrdersOpen(!ordersOpen);
  const toggleWorkers = () => setWorkersOpen(!workersOpen);

  const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  {
    name: "Orders",
    icon: ShoppingCart,
    children: [
      { name: "All Orders", href: "/orders", onClick: toggleOrders },
      { name: "Violations", href: "/violations" },
    ],
    isOpen: ordersOpen,
  },
  {
    name: "Workers",
    icon: Users,
    children: [
      { name: "Workers", href: "/workers", onClick: toggleWorkers },
      { name: "Task Management", href: "/task-management" },
    ],
    isOpen: workersOpen,
  },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Clients", href: "/clients", icon: User },
  { name: "Transactions", href: "/transactions", icon: Wrench },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "SMS", href: "/sms", icon: MessageSquare },
  { name: "Reports", href: "/reports", icon: FileText },
  ];

  const adminNavigation = [
    { name: "User Management", href: "/users", icon: Settings },
  ];

  const handleLogout = () => logout();

  const getInitials = (name) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Rental App</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isGroup = !!item.children;
            if (!isGroup) {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            }

            const isAnyChildActive = item.children.some(
              (c) => location.pathname === c.href
            );
            const [open, setOpen] = [isAnyChildActive];
            const Icon = item.icon;

            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isAnyChildActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {isAnyChildActive ? "-" : "+"}
                  </span>
                </button>
                <div className="pl-9 space-y-1">
                  {item.children.map((child) => {
                    const isActive = location.pathname === child.href;
                    return (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {isAdmin && (
            <>
              <div className="my-4">
                <div className="h-px bg-gray-200" />
              </div>
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {(() => {
                  const direct = navigation.find(
                    (item) => item.href === location.pathname
                  );
                  if (direct) return direct.name;
                  for (const item of navigation) {
                    if (item.children) {
                      const child = item.children.find(
                        (c) => c.href === location.pathname
                      );
                      if (child) return child.name;
                    }
                  }
                  return "Dashboard";
                })()}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Welcome, {user?.name}</div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(user?.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ordersOpen && (
                    <DropdownMenu>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link to="/orders">All Orders</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/violations">Violations</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main
          className={`${fullBleed ? "p-0" : "p-6"} w-full`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

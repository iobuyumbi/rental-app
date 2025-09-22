import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load user:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // More specific error messages
      let errorMessage = "Failed to load user profile";
      if (err.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.status === 403) {
        errorMessage = "Access denied. Please contact your administrator.";
      } else if (err.code === "OFFLINE") {
        errorMessage = "You are offline. Please check your connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.login(credentials);
      console.log('Login response:', response);
      
      // Handle server response format: {success: true, data: {token, ...userData}}
      let token, userData;
      if (response.token) {
        // Direct format: {token: "...", ...userData}
        token = response.token;
        userData = { ...response };
        delete userData.token; // Remove token from user data
      } else {
        throw new Error('Invalid response format - no token found');
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);

      // Enhanced error handling with specific messages
      let errorMessage = "Login failed. Please try again.";

      if (err.status === 401) {
        errorMessage =
          "Invalid username or password. Please check your credentials.";
      } else if (err.status === 403) {
        errorMessage =
          "Account access denied. Please contact your administrator.";
      } else if (err.status === 429) {
        errorMessage =
          "Too many login attempts. Please wait a moment and try again.";
      } else if (err.status >= 500) {
        errorMessage =
          "Server error. Please try again later or contact support.";
      } else if (err.code === "OFFLINE") {
        errorMessage =
          "You are offline. Please check your internet connection.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage =
          "Request timed out. Please check your connection and try again.";
      } else if (err.message && err.message !== "Request failed") {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.register(userData);
      const { token, ...userInfo } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userInfo));
      setUser(userInfo);

      return { success: true };
    } catch (err) {
      console.error("Registration error:", err);

      let errorMessage = "Registration failed. Please try again.";

      if (err.status === 400) {
        errorMessage =
          "Invalid registration data. Please check your information.";
      } else if (err.status === 409) {
        errorMessage =
          "Username or email already exists. Please choose different credentials.";
      } else if (err.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message && err.message !== "Request failed") {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setError(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.updateProfile(userData);
      const { token, ...userInfo } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userInfo));
      setUser(userInfo);

      return { success: true };
    } catch (err) {
      console.error("Profile update error:", err);

      let errorMessage = "Profile update failed. Please try again.";

      if (err.status === 400) {
        errorMessage = "Invalid profile data. Please check your information.";
      } else if (err.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message && err.message !== "Request failed") {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === "Admin",
    isAdminAssistant: user?.role === "AdminAssistant",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

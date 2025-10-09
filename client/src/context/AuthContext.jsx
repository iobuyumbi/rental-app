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
    const cachedUser = localStorage.getItem("user");
    
    if (token && cachedUser) {
      try {
        // First set the cached user data immediately to prevent redirect
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        setLoading(false);
        
        // Then validate the token in the background
        loadUser();
      } catch (err) {
        console.error("Error parsing cached user data:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoading(false);
      }
    } else if (token) {
      // Token exists but no cached user data
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response) {
        setUser(response);
        setError(null);
        // Cache user data for faster loading next time
        localStorage.setItem("user", JSON.stringify(response));
      } else {
        throw new Error("Failed to load user data");
      }
    } catch (err) {
      console.error("Failed to load user:", err);
      
      // Only clear auth data for actual authentication errors (401/403)
      // Don't clear for network errors or other temporary issues
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        
        let errorMessage = "Session expired. Please log in again.";
        if (err.response.status === 403) {
          errorMessage = "Access denied. Please contact your administrator.";
        }
        setError(errorMessage);
      } else if (err.message === "Network Error") {
        // For network errors, keep the user logged in but show a warning
        console.warn("Network error during token validation, keeping user logged in:", err);
        // Don't set error for network issues to avoid confusing the user
      } else {
        setError("Failed to load user data. Please try again.");
      }
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
      
      // Handle server response format
      if (response && response.token) {
        // Extract user data and token
        const token = response.token;
        const userData = { ...response };
        delete userData.token; // Remove token from user data
        
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        return { success: true };
      } else {
        throw new Error('Invalid response format - no token found');
      }
    } catch (err) {
      console.error("Login error:", err);

      // Enhanced error handling with specific messages
      let errorMessage = "Login failed. Please try again.";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Invalid username or password. Please check your credentials.";
        } else if (err.response.status === 403) {
          errorMessage = "Account access denied. Please contact your administrator.";
        } else if (err.response.status === 429) {
          errorMessage = "Too many login attempts. Please wait a moment and try again.";
        } else if (err.response.status >= 500) {
          errorMessage = "Server error. Please try again later or contact support.";
        }
      } else if (err.message === "Network Error") {
        errorMessage = "You are offline. Please check your internet connection.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your connection and try again.";
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
      
      if (response && response.token) {
        // Extract user data
        const token = response.token;
        const userInfo = { ...response };
        delete userInfo.token; // Remove token from user data

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userInfo));
        setUser(userInfo);

        return { success: true };
      } else {
        throw new Error('Registration failed - invalid response format');
      }
    } catch (err) {
      console.error("Registration error:", err);

      let errorMessage = "Registration failed. Please try again.";

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = "Invalid registration data. Please check your information.";
        } else if (err.response.status === 409) {
          errorMessage = "Username or email already exists. Please choose different credentials.";
        } else if (err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
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
      
      if (response) {
        // Check if response contains a new token
        let updatedUserInfo;
        if (response.token) {
          const token = response.token;
          updatedUserInfo = { ...response };
          delete updatedUserInfo.token; // Remove token from user data
          localStorage.setItem("token", token);
        } else {
          updatedUserInfo = response;
        }

        localStorage.setItem("user", JSON.stringify(updatedUserInfo));
        setUser(updatedUserInfo);

        return { success: true };
      } else {
        throw new Error('Profile update failed - invalid response');
      }
    } catch (err) {
      console.error("Profile update error:", err);

      let errorMessage = "Profile update failed. Please try again.";

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = "Invalid profile data. Please check your information.";
        } else if (err.response.status === 401) {
          // Handle expired session
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          errorMessage = "Session expired. Please log in again.";
        } else if (err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
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
    isAdmin: user?.role === "admin",
    isAdminAssistant: user?.role === "admin_assistant",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { authAPI } from "../lib/api";
import toast from "react-hot-toast";

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organization: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<{ success: boolean; user?: User; error?: string }>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Cookies.get("token");
      const savedUser = Cookies.get("user");

      if (token && savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);

        // Verify token is still valid
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        } catch (error: any) {
          // Token invalid, clear auth silently
          console.log("Token validation failed, clearing auth");
          Cookies.remove("token");
          Cookies.remove("user");
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Clear auth silently on any error
      Cookies.remove("token");
      Cookies.remove("user");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;

      // Save to cookies
      Cookies.set("token", token, { expires: 7 }); // 7 days
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });

      setUser(userData);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      return { success: true, user: userData };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Login failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { user: newUser, token } = response.data;

      // Save to cookies
      Cookies.set("token", token, { expires: 7 });
      Cookies.set("user", JSON.stringify(newUser), { expires: 7 });

      setUser(newUser);
      setIsAuthenticated(true);

      toast.success("Registration successful!");
      return { success: true, user: newUser };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Registration failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const updateProfile = async (profileData: any) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });

      toast.success("Profile updated successfully!");
      return { success: true, user: updatedUser };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Profile update failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

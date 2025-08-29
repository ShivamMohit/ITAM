import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const organizationService = {
  // Get available organizations for registration
  getAvailableOrganizations: async () => {
    try {
      const response = await api.get("/organization/available");
      return response.data;
    } catch (error) {
      console.error("Error fetching available organizations:", error);
      throw error;
    }
  },

  // Get organization details (requires authentication)
  getOrganizationDetails: async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await api.get("/organization/details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching organization details:", error);
      throw error;
    }
  },

  // Get organization statistics (requires authentication)
  getOrganizationStats: async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await api.get("/organization/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching organization stats:", error);
      throw error;
    }
  },
};

export default organizationService;

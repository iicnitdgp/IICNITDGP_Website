import store from '../store';
import { refreshTokenSuccess, refreshTokenFailure, logout } from '../store/slices/authSlice';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios-like instance with interceptors
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get access token from Redux store
  getAccessToken() {
    const state = store.getState();
    return state.auth.accessToken;
  }

  // Get refresh token from Redux store
  getRefreshToken() {
    const state = store.getState();
    return state.auth.refreshToken;
  }

  // Make HTTP request with automatic token handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = this.getAccessToken();

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if access token exists
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If access token expired, try to refresh
      if (response.status === 401 && accessToken) {
        const refreshed = await this.refreshAccessToken();
        
        if (refreshed) {
          // Retry the original request with new token
          const newAccessToken = this.getAccessToken();
          headers.Authorization = `Bearer ${newAccessToken}`;
          
          return await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Refresh failed, logout user
          store.dispatch(logout());
          throw new Error('Session expired. Please login again.');
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        store.dispatch(refreshTokenFailure());
        return false;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        store.dispatch(refreshTokenSuccess({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        }));
        return true;
      } else {
        store.dispatch(refreshTokenFailure());
        return false;
      }
    } catch (error) {
      store.dispatch(refreshTokenFailure());
      return false;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.json();
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Even if server logout fails, clear local state
      console.error('Server logout failed:', error);
    }
    store.dispatch(logout());
  }

  async getProfile() {
    const response = await this.request('/auth/profile');
    return response.json();
  }

  async updateProfile(profileData) {
    const response = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.json();
  }

  // User Profile Management
  async getUserProfile() {
    const response = await this.request('/user/profile');
    const data = await response.json();
    if (data.success) {
      return data.user;
    }
    throw new Error(data.message || 'Failed to fetch profile');
  }

  async updateUserProfile(profileData) {
    const response = await this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (data.success) {
      // Update Redux store with new user data
      store.dispatch({ type: 'auth/updateUser', payload: data.user });
      return data.user;
    }
    throw new Error(data.message || 'Failed to update profile');
  }

  async changePassword(passwordData) {
    const response = await this.request('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to change password');
  }

  // Admin User Management
  async createUser(userData) {
    const response = await this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to create user');
  }

  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
    const response = await this.request(url);
    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to fetch users');
  }

  async getUserById(userId) {
    const response = await this.request(`/admin/users/${userId}`);
    const data = await response.json();
    if (data.success) {
      return data.user;
    }
    throw new Error(data.message || 'Failed to fetch user');
  }

  async updateUser(userId, userData) {
    const response = await this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (data.success) {
      return data.user;
    }
    throw new Error(data.message || 'Failed to update user');
  }

  async deleteUser(userId) {
    const response = await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to delete user');
  }

  // Webinar/Event Management (using Webinar schema for admin portal)
  async createWebinar(webinarData) {
    const response = await this.request('/webinars', {
      method: 'POST',
      body: JSON.stringify(webinarData),
    });
    const data = await response.json();
    if (data.webinar) {
      return data.webinar;
    }
    throw new Error(data.message || 'Failed to create event');
  }

  async getAllWebinars(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/webinars?${queryString}` : '/webinars';
    const response = await this.request(url);
    // The webinar endpoint returns data directly, not wrapped in success object
    return response.json();
  }

  async getWebinarById(webinarId) {
    const response = await this.request(`/webinars/${webinarId}`);
    return response.json();
  }

  async updateWebinar(webinarId, webinarData) {
    const response = await this.request(`/webinars/${webinarId}`, {
      method: 'PUT',
      body: JSON.stringify(webinarData),
    });
    const data = await response.json();
    if (data.webinar) {
      return data.webinar;
    }
    throw new Error(data.message || 'Failed to update event');
  }

  async deleteWebinar(webinarId) {
    const response = await this.request(`/webinars/${webinarId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.message) {
      return data;
    }
    throw new Error(data.message || 'Failed to delete event');
  }

  async getWebinarCategories() {
    return ['workshop', 'seminar', 'conference', 'webinar', 'hackathon', 'competition', 'other'];
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

import store from '../store';
import { refreshTokenSuccess, refreshTokenFailure, logout } from '../store/slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Fetch wrapper that handles automatic token refresh
 * If a request fails with 401, it attempts to refresh the token and retry
 */
export const fetchWithTokenRefresh = async (url, options = {}) => {
  const state = store.getState();
  const accessToken = state.auth.accessToken;
  const refreshToken = state.auth.refreshToken;

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization if token exists
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get 401 and have a refresh token, try to refresh
    if (response.status === 401 && refreshToken && accessToken) {
      const refreshed = await refreshAccessToken(refreshToken);

      if (refreshed) {
        // Get new token from store
        const newState = store.getState();
        const newAccessToken = newState.auth.accessToken;

        // Retry original request with new token
        headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, logout
        store.dispatch(logout());
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
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
    console.error('Token refresh error:', error);
    store.dispatch(refreshTokenFailure());
    return false;
  }
}

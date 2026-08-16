import axios from 'axios';
import { Platform } from 'react-native';
import { API_URL } from './constants';
import * as SecureStore from 'expo-secure-store';

// Storage utility
const Storage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }
};

// Create API client
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000
});

// Debug interceptor
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    url: request.url,
    method: request.method,
    baseURL: request.baseURL,
    headers: request.headers
  });
  return request;
});

api.interceptors.response.use(response => {
  console.log('Response:', {
    url: response.config.url,
    status: response.status,
    data: response.data
  });
  return response;
}, error => {
  console.error('API Error:', {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
  return Promise.reject(error);
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await Storage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Request error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      console.error('Network Error:', error.message);
      throw new Error('Network error. Please check your connection.');
    }
    
    if (error.response?.status === 401) {
      console.warn('Authentication error. User may need to login again.');
    }
    
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`API Error (${error.response?.status}):`, errorMessage);
    
    return Promise.reject(error);
  }
);

export default api; 
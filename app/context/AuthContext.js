import { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../config/api';
import { Platform } from 'react-native';

// Storage utility to handle both web and native platforms
const Storage = {
  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
    }
  },
  
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
  },
  
  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }
};

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          Storage.getItem('user'),
          Storage.getItem('token')
        ]);

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          // Ensure role is in uppercase
          if (userData.role) {
            userData.role = userData.role.toUpperCase();
          }
          // Set user with token
          setUser({ ...userData, token: storedToken });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== Login Attempt ===');
      console.log('Email:', email);
      const response = await api.post('/auth/login', { email, password });
      
      if (!response.data.success) {
        console.error('Login failed:', response.data.message);
        throw new Error(response.data.message || 'Login failed');
      }

      const userData = response.data.user;
      console.log('=== Login Response ===');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      console.log('User data before role normalization:', userData);
      
      // Ensure role is in uppercase and consistent
      if (userData.role) {
        userData.role = userData.role.toUpperCase();
        console.log('Normalized user role:', userData.role);
      } else {
        console.error('No role found in user data');
        throw new Error('Invalid user data: role missing');
      }

      // Store token and user data
      await Storage.setItem('token', response.data.token);
      await Storage.setItem('user', JSON.stringify(userData));
      
      // Set user in context with token
      const userWithToken = { ...userData, token: response.data.token };
      console.log('Setting user in context:', JSON.stringify(userWithToken, null, 2));
      setUser(userWithToken);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      if (!userData) {
        return {
          success: false,
          error: 'Registration data is missing'
        };
      }

      // Validate required fields
      if (!userData.name || !userData.email || !userData.password) {
        return {
          success: false,
          error: 'Please provide name, email, and password'
        };
      }

      // Ensure role is correct case
      if (userData.role) {
        userData.role = userData.role === 'NGO' ? 'NGO' : 'user';
      }

      // Validate NGO-specific fields if role is NGO
      if (userData.role === 'NGO') {
        if (!userData.organization?.name || !userData.organization?.type || 
            !userData.organization?.address || !userData.organization?.phone) {
          return {
            success: false,
            error: 'Please provide all required NGO information'
          };
        }
      }

      console.log('Attempting signup with:', JSON.stringify(userData, null, 2));
      
      const response = await api.post('/auth/register', userData);

      console.log('Signup response:', response.data);

      const { token, user: registeredUser } = response.data;
      
      // Store both the user data and token
      await Storage.setItem('token', token);
      await Storage.setItem('user', JSON.stringify(registeredUser));
      
      // Set the user in context with token
      setUser({...registeredUser, token});
      
      console.log('Signup successful for user:', registeredUser.name, 'Role:', registeredUser.role);
      
      return { 
        success: true,
        user: registeredUser
      };
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await Storage.removeItem('token');
      await Storage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Helper function to provide clear error messages for network issues
  const getConnectionErrorMessage = () => {
    let baseMessage = 'Could not connect to the server. ';
    
    if (Platform.OS === 'android') {
      return baseMessage + 'Please check that the backend server is running and accessible from your device.';
    } else if (Platform.OS === 'ios') {
      return baseMessage + 'Please check that the backend server is running on localhost:5000.';
    } else {
      return baseMessage + 'Please check your network connection and ensure the server is running.';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
      setUser,
      token: user?.token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
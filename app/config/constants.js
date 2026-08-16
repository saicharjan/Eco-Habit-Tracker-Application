import { Platform } from 'react-native';

// API URL Configuration
let apiUrl;

if (Platform.OS === 'web') {
  // For web platform, always use localhost
  apiUrl = 'http://localhost:5000';
} else if (Platform.OS === 'android') {
  // For Android physical devices, use the computer's local IP address
  apiUrl = 'http://192.168.227.154:5000';
} else if (Platform.OS === 'ios') {
  // For iOS, use localhost
  apiUrl = 'http://localhost:5000';
}

// Export the determined API URL
export const API_URL = apiUrl;

// Add debugging information
console.log('=== API Configuration ===');
console.log('Platform:', Platform.OS);
console.log('API URL:', API_URL);

// Application constants
export const APP_NAME = 'Eco-Habit';
export const APP_VERSION = '1.0.0';

// Timeout settings
export const API_TIMEOUT = 15000; // 15 seconds
export const RETRY_ATTEMPTS = 3; 
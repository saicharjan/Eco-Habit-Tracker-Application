/**
 * Mobile Network Diagnostic Utility
 */
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/constants';

/**
 * Perform a complete network diagnostic test
 * @returns {Promise<Object>} Diagnostic results
 */
export const runNetworkDiagnostic = async () => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      device: {
        platform: Platform.OS,
        version: Platform.Version,
        isEmulator: isEmulator(),
      },
      network: await getNetworkInfo(),
      connectivity: {
        server: await checkServerConnectivity(),
        internet: await checkInternetConnectivity(),
      },
      apiDetails: {
        url: API_URL,
      }
    };
    
    return results;
  } catch (error) {
    console.error('Network diagnostic error:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check if the device is an emulator
 * @returns {boolean}
 */
export const isEmulator = () => {
  if (Platform.OS === 'android') {
    return Platform.constants.Brand === 'google' && 
           Platform.constants.Model.includes('sdk');
  } else if (Platform.OS === 'ios') {
    // iOS simulator detection is not as straightforward
    return Platform.constants.isSimulator === true;
  }
  return false;
};

/**
 * Get detailed network information
 * @returns {Promise<Object>}
 */
export const getNetworkInfo = async () => {
  const netInfo = await NetInfo.fetch();
  
  return {
    type: netInfo.type,
    isConnected: netInfo.isConnected,
    isInternetReachable: netInfo.isInternetReachable,
    details: netInfo.details || {},
  };
};

/**
 * Check if server is reachable
 * @returns {Promise<Object>}
 */
export const checkServerConnectivity = async () => {
  const endpoints = [
    {
      name: 'Health Check',
      url: `${API_URL}/health`,
      timeout: 5000
    },
    {
      name: 'Test Endpoint',
      url: `${API_URL}/test`,
      timeout: 5000
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, { 
        timeout: endpoint.timeout,
        validateStatus: () => true // Accept any status code
      });
      const endTime = Date.now();
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        reachable: true,
        statusCode: response.status,
        latency: endTime - startTime,
        data: response.data
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        reachable: false,
        error: error.message
      });
    }
  }
  
  return {
    endpoints: results,
    success: results.some(result => result.reachable),
    message: getConnectivityMessage(results)
  };
};

/**
 * Check internet connectivity by pinging public services
 * @returns {Promise<Object>}
 */
export const checkInternetConnectivity = async () => {
  const endpoints = [
    {
      name: 'Google',
      url: 'https://www.google.com',
      timeout: 5000
    },
    {
      name: 'Cloudflare',
      url: 'https://cloudflare-dns.com/dns-query',
      timeout: 5000
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, { 
        timeout: endpoint.timeout,
        validateStatus: () => true, // Accept any status code
        headers: endpoint.url.includes('cloudflare') ? { 'Accept': 'application/dns-json' } : {}
      });
      const endTime = Date.now();
      
      results.push({
        name: endpoint.name,
        reachable: true,
        statusCode: response.status,
        latency: endTime - startTime
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        reachable: false,
        error: error.message
      });
    }
  }
  
  return {
    endpoints: results,
    success: results.some(result => result.reachable)
  };
};

/**
 * Generate a user-friendly message based on connectivity results
 * @param {Array} results The connectivity check results
 * @returns {string} A user-friendly message
 */
export const getConnectivityMessage = (results) => {
  if (results.every(result => result.reachable)) {
    return "All server endpoints are reachable. Your connection is working correctly.";
  }
  
  if (results.some(result => result.reachable)) {
    return "Some server endpoints are reachable, but there might be partial connectivity issues.";
  }
  
  // Check for specific error types
  const errorMessages = results.map(result => result.error || '');
  
  if (errorMessages.some(msg => msg.includes('Network Error') || msg.includes('timeout'))) {
    return "Cannot connect to the server. Please check that the server is running and that your device is on the same network.";
  }
  
  if (errorMessages.some(msg => msg.includes('ECONNREFUSED'))) {
    return "Connection refused. The server may not be running or the port might be blocked.";
  }
  
  return "Unable to connect to the server. Please check your network settings and server configuration.";
};

/**
 * Get troubleshooting tips based on diagnostic results
 * @param {Object} diagnosticResults The results from runNetworkDiagnostic
 * @returns {Array<string>} Array of troubleshooting tips
 */
export const getTroubleshootingTips = (diagnosticResults) => {
  const tips = [];
  
  // Check device type and provide appropriate advice
  if (diagnosticResults.device.platform === 'android') {
    if (diagnosticResults.device.isEmulator) {
      tips.push("For Android emulators, make sure your API_URL is set to 'http://10.0.2.2:5000'");
    } else {
      tips.push("For physical Android devices, ensure the API_URL is set to your computer's local IP address");
    }
  } else if (diagnosticResults.device.platform === 'ios') {
    if (diagnosticResults.device.isEmulator) {
      tips.push("For iOS simulators, make sure your API_URL is set to 'http://localhost:5000'");
    } else {
      tips.push("For physical iOS devices, ensure the API_URL is set to your computer's local IP address");
    }
  }
  
  // Network type specific tips
  if (diagnosticResults.network.type === 'cellular') {
    tips.push("You're on a cellular network. The backend server might not be accessible from outside your local network.");
  }
  
  // Server connectivity tips
  if (!diagnosticResults.connectivity.server.success) {
    tips.push("Check that the backend server is running (cd backend && npm run dev)");
    tips.push("Verify that your computer's firewall allows connections on port 5000");
  }
  
  // Internet connectivity tips
  if (!diagnosticResults.connectivity.internet.success) {
    tips.push("Your device doesn't appear to have internet connectivity. Check your WiFi or cellular data connection.");
  } else if (!diagnosticResults.connectivity.server.success) {
    tips.push("You have internet access but can't reach the server. Make sure your device and server are on the same network.");
  }
  
  // General tips
  tips.push("Try restarting the backend server");
  tips.push("Ensure the correct API_URL is set in app/config/constants.js");
  
  return tips;
};

export default {
  runNetworkDiagnostic,
  getNetworkInfo,
  checkServerConnectivity,
  checkInternetConnectivity,
  isEmulator,
  getTroubleshootingTips
}; 
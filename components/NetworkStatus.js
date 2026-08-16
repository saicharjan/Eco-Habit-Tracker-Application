import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Try to import API_URL, fallback to a default if it fails
let API_URL;
try {
  const constants = require('../app/config/constants');
  API_URL = constants.API_URL;
} catch (error) {
  console.warn('Failed to import API_URL, using fallback URL');
  API_URL = 'http://localhost:5000';
}

const NetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [pingTime, setPingTime] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const startTime = Date.now();
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      setPingTime(latency);
      setIsConnected(response.status === 200);
      console.log('Server connection check:', response.status === 200 ? 'Connected' : 'Failed');
    } catch (error) {
      console.log('Server connection failed:', error.message);
      setIsConnected(false);
      setPingTime(null);
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Check connection on component mount
    checkConnection();

    // Set interval to check connection periodically
    const intervalId = setInterval(checkConnection, 30000); // every 30 seconds

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!expanded) {
    // Collapsed view
    return (
      <TouchableOpacity 
        style={[
          styles.collapsedContainer, 
          isConnected === true ? styles.connected : 
          isConnected === false ? styles.disconnected : 
          styles.unknown
        ]}
        onPress={() => setExpanded(true)}
      >
        <Ionicons 
          name={
            isConnected === true ? "wifi" : 
            isConnected === false ? "wifi-off" : 
            "help-circle"
          } 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.collapsedText}>
          {isConnected === true ? "Connected" : 
           isConnected === false ? "Disconnected" : 
           "Checking..."}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Status</Text>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Ionicons name="close" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <Ionicons 
          name={isConnected ? "wifi" : "wifi-outline"} 
          size={24} 
          color={isConnected ? '#4CAF50' : '#F44336'} 
        />
        <Text style={[styles.statusText, { color: isConnected ? '#4CAF50' : '#F44336' }]}>
          {isConnected ? 'Connected' : 'Offline'}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusIndicator}>
            {isChecking ? (
              <Text style={styles.checking}>Checking...</Text>
            ) : isConnected ? (
              <>
                <View style={styles.connectedDot} />
                <Text style={styles.connected}>Connected</Text>
              </>
            ) : (
              <>
                <View style={styles.disconnectedDot} />
                <Text style={styles.disconnected}>Disconnected</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Server URL:</Text>
          <Text style={styles.value}>{API_URL}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Platform:</Text>
          <Text style={styles.value}>{Platform.OS}</Text>
        </View>

        {pingTime !== null && (
          <View style={styles.statusRow}>
            <Text style={styles.label}>Ping:</Text>
            <Text style={styles.value}>{pingTime}ms</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.label}>Last checked:</Text>
          <Text style={styles.value}>{lastChecked ? formatTime(lastChecked) : 'Never'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={checkConnection}>
        <Ionicons name="refresh" size={16} color="#fff" />
        <Text style={styles.refreshText}>Refresh Status</Text>
      </TouchableOpacity>

      {!isConnected && !isChecking && (
        <View style={styles.troubleshooting}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting Tips:</Text>
          <Text style={styles.troubleshootingItem}>• Ensure backend server is running</Text>
          <Text style={styles.troubleshootingItem}>• Check that API_URL matches your server</Text>
          <Text style={styles.troubleshootingItem}>• Verify network connection on your device</Text>
          <Text style={styles.troubleshootingItem}>• Android emulator should use 10.0.2.2:5000</Text>
          <Text style={styles.troubleshootingItem}>• Physical devices should use your PC's IP address</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    marginBottom: 10,
    marginHorizontal: 10,
    maxWidth: 120,
  },
  connected: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  disconnected: {
    backgroundColor: '#F44336',
    color: 'white',
  },
  unknown: {
    backgroundColor: '#757575',
    color: 'white',
  },
  collapsedText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  value: {
    color: '#333',
    flex: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  connectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  disconnectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
    marginRight: 5,
  },
  checking: {
    color: '#757575',
    fontStyle: 'italic',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  refreshText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  troubleshooting: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFF9C4',
    borderRadius: 5,
  },
  troubleshootingTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  troubleshootingItem: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NetworkStatus; 
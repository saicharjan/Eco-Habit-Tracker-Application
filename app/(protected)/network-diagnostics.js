import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Linking,
  ToastAndroid,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

// Try to import using correct path
let networkDiagnostic;
let API_URL;
try {
  // The file exports named functions, not a default export
  const diagnosticUtils = require('../../utils/networkDiagnostic');
  networkDiagnostic = {
    runNetworkDiagnostic: diagnosticUtils.runNetworkDiagnostic,
    getTroubleshootingTips: diagnosticUtils.getTroubleshootingTips,
    isEmulator: diagnosticUtils.isEmulator
  };
  
  const constants = require('../config/constants');
  API_URL = constants.API_URL;
} catch (error) {
  console.warn('Failed to import networkDiagnostic or API_URL', error);
  // Fallback implementation
  networkDiagnostic = {
    runNetworkDiagnostic: async () => ({
      connectivity: { 
        internet: { success: false, message: 'Fallback implementation' },
        server: { 
          success: false, 
          message: 'Import error: ' + error.message,
          endpoints: []
        }
      },
      network: { type: 'unknown', isConnected: false, isInternetReachable: false }
    }),
    getTroubleshootingTips: () => ['Fix import paths for networkDiagnostic.js'],
    isEmulator: () => false
  };
  API_URL = 'http://localhost:5000';
}

export default function NetworkDiagnosticsScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const diagnosticResults = await networkDiagnostic.runNetworkDiagnostic();
      setResults(diagnosticResults);
      console.log('Diagnostic results:', diagnosticResults);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await runDiagnostics();
    setRefreshing(false);
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    }
  };

  const getTips = () => {
    if (!results) return [];
    return networkDiagnostic.getTroubleshootingTips(results);
  };

  const getStatusColor = (isSuccess) => {
    return isSuccess ? '#4CAF50' : '#F44336';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Network Diagnostics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connection Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Server URL:</Text>
            <TouchableOpacity 
              onPress={() => copyToClipboard(API_URL)}
              style={styles.copyableText}
            >
              <Text style={styles.value}>{API_URL}</Text>
              <Ionicons name="copy-outline" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Device Platform:</Text>
            <Text style={styles.value}>{Platform.OS}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Device Type:</Text>
            <Text style={styles.value}>
              {networkDiagnostic.isEmulator() ? 'Emulator/Simulator' : 'Physical Device'}
            </Text>
          </View>
        </View>

        {!results && !isRunning && (
          <View style={styles.emptyState}>
            <Ionicons name="wifi-outline" size={64} color="#888" />
            <Text style={styles.emptyStateText}>
              Run a diagnostic test to check your connection to the server.
            </Text>
            <TouchableOpacity style={styles.runButton} onPress={runDiagnostics}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.runButtonText}>Run Diagnostic Test</Text>
            </TouchableOpacity>
          </View>
        )}

        {isRunning && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Running network diagnostics...</Text>
          </View>
        )}

        {results && !isRunning && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Test Results</Text>
              <View style={styles.resultRow}>
                <Text style={styles.label}>Internet Connectivity:</Text>
                <View style={styles.statusContainer}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(results.connectivity.internet.success) }
                    ]} 
                  />
                  <Text style={styles.statusText}>
                    {results.connectivity.internet.success ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.label}>Server Connectivity:</Text>
                <View style={styles.statusContainer}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(results.connectivity.server.success) }
                    ]} 
                  />
                  <Text style={styles.statusText}>
                    {results.connectivity.server.success ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              {results.connectivity.server.message && (
                <View style={styles.messageContainer}>
                  <Text style={styles.messageText}>{results.connectivity.server.message}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => copyToClipboard(JSON.stringify(results, null, 2))}
              >
                <Text style={styles.detailsButtonText}>Copy Full Results</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Network Details</Text>
              <View style={styles.resultRow}>
                <Text style={styles.label}>Connection Type:</Text>
                <Text style={styles.value}>{results.network?.type || 'Unknown'}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.label}>Connected:</Text>
                <Text style={styles.value}>{results.network?.isConnected ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.label}>Internet Reachable:</Text>
                <Text style={styles.value}>{results.network?.isInternetReachable ? 'Yes' : 'No'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Server Endpoints</Text>
              {results.connectivity.server.endpoints.map((endpoint, index) => (
                <View key={index} style={styles.endpointContainer}>
                  <View style={styles.endpointHeader}>
                    <Text style={styles.endpointName}>{endpoint.name}</Text>
                    <View style={styles.statusContainer}>
                      <View 
                        style={[
                          styles.statusDot, 
                          { backgroundColor: getStatusColor(endpoint.reachable) }
                        ]} 
                      />
                      <Text style={styles.statusText}>
                        {endpoint.reachable ? 'Reachable' : 'Unreachable'}
                      </Text>
                    </View>
                  </View>
                  {endpoint.reachable ? (
                    <View style={styles.endpointDetails}>
                      <Text style={styles.endpointDetail}>Status: {endpoint.statusCode}</Text>
                      <Text style={styles.endpointDetail}>Latency: {endpoint.latency}ms</Text>
                    </View>
                  ) : (
                    <View style={styles.endpointDetails}>
                      <Text style={styles.endpointError}>{endpoint.error}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Troubleshooting Tips</Text>
              {getTips().map((tip, index) => (
                <View key={index} style={styles.tipContainer}>
                  <Text style={styles.tipText}>• {tip}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.runButton} onPress={runDiagnostics}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.runButtonText}>Run Again</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  copyableText: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
  messageContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#555',
  },
  endpointContainer: {
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
  },
  endpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  endpointName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  endpointDetails: {
    marginTop: 4,
  },
  endpointDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  endpointError: {
    fontSize: 13,
    color: '#F44336',
  },
  tipContainer: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  runButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  runButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  detailsButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  detailsButtonText: {
    color: '#333',
    fontSize: 14,
  },
}); 
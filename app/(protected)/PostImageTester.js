import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { API_URL } from '../config/constants';

// A utility function to properly format image URLs
const getImageUrl = (imageUri) => {
  if (!imageUri) return null;
  
  // If it's already a full URL, return it
  if (imageUri.startsWith('http')) {
    return imageUri;
  }
  
  // Handle paths that start with /uploads/
  if (imageUri.startsWith('/uploads/')) {
    console.log(`Converting ${imageUri} to ${API_URL}${imageUri}`);
    return `${API_URL}${imageUri}`;
  }
  
  // For other relative paths, prepend API URL
  console.log(`Converting ${imageUri} to ${API_URL}/${imageUri}`);
  return `${API_URL}/${imageUri}`;
};

// Test images to try
const TEST_IMAGES = [
  // Test direct URLs
  'https://picsum.photos/200',
  // Test relative paths with /uploads/
  '/uploads/post-1742741508128-657477340.jpeg',
  // Test regular relative paths
  'uploads/post-1742741910676-608355536.jpeg',
  // Test non-existent images to see error handling
  '/uploads/nonexistent.jpg',
];

export default function PostImageTester() {
  const [imageErrors, setImageErrors] = useState({});
  
  const handleImageError = (index, error) => {
    console.error(`Error loading image ${index}:`, error.nativeEvent.error);
    setImageErrors(prev => ({
      ...prev,
      [index]: error.nativeEvent.error
    }));
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Image URL Tester</Text>
      <Text style={styles.subtitle}>API URL: {API_URL}</Text>
      
      {TEST_IMAGES.map((uri, index) => (
        <View key={index} style={styles.imageContainer}>
          <Text style={styles.imageText}>Original: {uri}</Text>
          <Text style={styles.imageText}>Processed: {getImageUrl(uri)}</Text>
          <Image
            source={{ uri: getImageUrl(uri) }}
            style={styles.image}
            onError={(e) => handleImageError(index, e)}
          />
          {imageErrors[index] && (
            <Text style={styles.errorText}>Error: {imageErrors[index]}</Text>
          )}
        </View>
      ))}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Network Information</Text>
        <Text style={styles.infoText}>
          Make sure your device can reach {API_URL}
        </Text>
        <Text style={styles.infoText}>
          Check that the server is running and the IP address is correct
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  imageContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
  infoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
}); 
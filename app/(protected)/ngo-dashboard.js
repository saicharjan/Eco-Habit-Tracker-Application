import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking
} from 'react-native';
import { useNGO } from '../context/NGOContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function NGODashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    ngoProfile,
    loading,
    error,
    fetchNGOProfile
  } = useNGO();

  useEffect(() => {
    console.log('Dashboard mounted, user:', user?.role);
    console.log('NGO Profile data:', ngoProfile);
  }, [user, ngoProfile]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading NGO Profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!ngoProfile || !ngoProfile.organization) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No NGO profile found</Text>
      </View>
    );
  }

  const { organization, stats } = ngoProfile;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchNGOProfile}
          colors={['#4CAF50']}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>NGO Profile</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Organization Name:</Text>
          <Text style={styles.value}>{organization.name || 'Not provided'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{organization.type || 'Not provided'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{organization.email || 'Not provided'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{organization.phone || 'Not provided'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{organization.address || 'Not provided'}</Text>
        </View>

        {organization.website && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Website:</Text>
            <Text 
              style={[styles.value, styles.link]}
              onPress={() => Linking.openURL(organization.website)}
            >
              {organization.website}
            </Text>
          </View>
        )}

        {organization.description && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{organization.description}</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.label}>Registration Number:</Text>
          <Text style={styles.value}>
            {organization.registrationNumber || 'Not provided'}
          </Text>
        </View>

        {organization.foundedYear && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>Founded Year:</Text>
            <Text style={styles.value}>{organization.foundedYear}</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[
            styles.value, 
            organization.isActive ? styles.activeStatus : styles.inactiveStatus
          ]}>
            {organization.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Last Login:</Text>
          <Text style={styles.value}>
            {organization.lastLogin ? new Date(organization.lastLogin).toLocaleString() : 'Not available'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalVolunteers || 0}</Text>
            <Text style={styles.statLabel}>Total Volunteers</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.activeProjects || 0}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.upcomingEvents || 0}</Text>
            <Text style={styles.statLabel}>Upcoming Events</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{stats?.totalDonations || 0}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </View>
        </View>
      </View>

      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug Information</Text>
        <Text style={styles.debugText}>User Role: {user?.role}</Text>
        <Text style={styles.debugText}>Organization ID: {organization._id || 'Not available'}</Text>
        <Text style={styles.debugText}>Created At: {organization.createdAt ? new Date(organization.createdAt).toLocaleString() : 'Not available'}</Text>
        <Text style={styles.debugText}>Updated At: {organization.updatedAt ? new Date(organization.updatedAt).toLocaleString() : 'Not available'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  link: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  inactiveStatus: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  debugSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  }
}); 
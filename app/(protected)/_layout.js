import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { NGOProvider } from '../context/NGOContext';
import { View, ActivityIndicator, Alert } from 'react-native';

export default function ProtectedLayout() {
  const { user, loading, token } = useAuth();

  console.log('=== Protected Layout ===');
  console.log('Loading state:', loading);
  console.log('User:', user ? JSON.stringify(user, null, 2) : 'No user');
  console.log('Token:', token ? 'Token exists' : 'No token');

  // Show loading indicator while checking authentication
  if (loading) {
    console.log('Still loading...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // If user is not logged in or no token, redirect to login
  if (!user || !token) {
    console.log('No user or token found, redirecting to login');
    return <Redirect href="/(public)/login" />;
  }

  // Get user role in uppercase for consistent comparison
  const userRole = user.role?.toUpperCase();
  console.log('User role:', userRole);
  console.log('User object:', JSON.stringify(user, null, 2));

  // Verify admin access
  if (userRole === 'ADMIN') {
    console.log('Admin access granted - redirecting to admin dashboard');
    return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="admin-dashboard"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    );
  }

  // Wrap NGO routes with NGOProvider
  if (userRole === 'NGO') {
    console.log('NGO access granted - redirecting to NGO dashboard');
    return (
      <NGOProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="ngo-dashboard"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </NGOProvider>
    );
  }

  // Default to user dashboard
  console.log('Regular user access granted - redirecting to user dashboard');
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 
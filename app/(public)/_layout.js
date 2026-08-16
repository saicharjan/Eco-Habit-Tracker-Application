import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { user } = useAuth();

  // If user is already logged in, redirect to appropriate dashboard
  if (user) {
    if (user.role === 'Admin') {
      return <Redirect href="/(protected)/admin-dashboard" />;
    }
    return <Redirect href="/(protected)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index"
        options={{ 
          headerShown: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="login"
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="signup"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
} 
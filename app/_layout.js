import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { NGOProvider } from './context/NGOContext';
import { Slot } from 'expo-router';

// Root layout wraps the app with necessary providers
export default function RootLayout() {
  return (
    <AuthProvider>
      <NGOProvider>
        <Slot />
      </NGOProvider>
    </AuthProvider>
  );
} 
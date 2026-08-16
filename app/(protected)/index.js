import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase();

  // Redirect NGO users to NGO dashboard
  if (userRole === 'NGO') {
    return <Redirect href="/(protected)/ngo-dashboard" />;
  }

  // Redirect admin users to admin dashboard
  if (userRole === 'ADMIN') {
    return <Redirect href="/(protected)/admin-dashboard" />;
  }

  // Default to user dashboard
  return <Redirect href="/(protected)/dashboard" />;
} 
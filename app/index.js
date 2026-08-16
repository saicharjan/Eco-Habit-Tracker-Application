import { Redirect } from 'expo-router';

export default function Index() {
  // Always redirect to the public landing page
  return <Redirect href="/(public)" />;
} 
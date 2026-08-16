import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

export default function LandingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      router.replace('/(protected)/dashboard');
    }
  }, [user]);

  const handleGetStarted = () => {
    console.log('Get Started button pressed');
    try {
      Alert.alert('Navigation', 'Attempting to navigate to login...');
      router.push('/(public)/login');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate to login page');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#ffffff', '#e8f5e9']}
        style={styles.gradient}
      >
        <View style={styles.contentContainer}>
          <View style={styles.decorativeLeaves}>
            <View style={[styles.leaf, styles.leaf1]} />
            <View style={[styles.leaf, styles.leaf2]} />
            <View style={[styles.leaf, styles.leaf3]} />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Eco-Habit</Text>
            <Text style={styles.subtitle}>
              Small habits, big impact. Start your sustainable journey today.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGetStarted}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.decorativeLeavesBottom}>
            <View style={[styles.leaf, styles.leaf4]} />
            <View style={[styles.leaf, styles.leaf5]} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 1,
  },
  decorativeLeaves: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 150,
    zIndex: 0,
  },
  decorativeLeavesBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: 150,
    zIndex: 0,
  },
  leaf: {
    position: 'absolute',
    width: 40,
    height: 80,
    borderTopLeftRadius: 50,
    borderBottomRightRadius: 50,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  leaf1: {
    top: 20,
    right: 40,
  },
  leaf2: {
    top: 50,
    right: 80,
    transform: [{ rotate: '65deg' }],
  },
  leaf3: {
    top: 30,
    right: 120,
    transform: [{ rotate: '25deg' }],
  },
  leaf4: {
    bottom: 40,
    left: 40,
    transform: [{ rotate: '-145deg' }],
  },
  leaf5: {
    bottom: 70,
    left: 80,
    transform: [{ rotate: '-165deg' }],
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 
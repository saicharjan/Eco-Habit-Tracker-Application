import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import NetworkStatus from '../../components/NetworkStatus';

const ROLES = ['user', 'NGO'];

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // NGO-specific fields
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const [organizationPhone, setOrganizationPhone] = useState('');
  const [organizationWebsite, setOrganizationWebsite] = useState('');

  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate NGO-specific fields
    if (role === 'NGO') {
      if (!organizationName || !organizationType || !organizationAddress || !organizationPhone) {
        setError('Please fill in all NGO-specific fields');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const signupData = {
        name,
        email,
        password,
        role: role, // Will be 'NGO' or 'user'
        organization: role === 'NGO' ? {
          name: organizationName,
          type: organizationType,
          address: organizationAddress,
          phone: organizationPhone,
          website: organizationWebsite || undefined
        } : undefined
      };

      console.log('Sending registration data:', signupData);
      const result = await signup(signupData);
      if (result.success) {
        // Redirect based on role
        if (role === 'NGO') {
          router.replace('/(protected)/ngo-dashboard');
        } else {
          router.replace('/(protected)/dashboard');
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An error occurred during signup');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Network status indicator for debugging */}
        <NetworkStatus />
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>EcoHabit</Text>
          <Text style={styles.subtitle}>Create an account to start your eco-friendly journey today.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.formContainer}>
          {/* Role Selection */}
          <View style={styles.roleSelector}>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'user' && styles.roleButtonActive]} 
              onPress={() => setRole('user')}
            >
              <Text style={[styles.roleButtonText, role === 'user' && styles.roleButtonTextActive]}>User</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'NGO' && styles.roleButtonActive]} 
              onPress={() => setRole('NGO')}
            >
              <Text style={[styles.roleButtonText, role === 'NGO' && styles.roleButtonTextActive]}>NGO</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            </View>
          </View>

          {/* NGO-specific fields */}
          {role === 'NGO' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Organization Name *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter organization name"
                    value={organizationName}
                    onChangeText={setOrganizationName}
                    autoCapitalize="words"
                  />
                  <Ionicons name="business-outline" size={20} color="#888" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Organization Type *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Environmental, Wildlife, Conservation"
                    value={organizationType}
                    onChangeText={setOrganizationType}
                    autoCapitalize="words"
                  />
                  <Ionicons name="leaf-outline" size={20} color="#888" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Organization Address *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter organization address"
                    value={organizationAddress}
                    onChangeText={setOrganizationAddress}
                    autoCapitalize="words"
                  />
                  <Ionicons name="location-outline" size={20} color="#888" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Organization Phone *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter organization phone number"
                    value={organizationPhone}
                    onChangeText={setOrganizationPhone}
                    keyboardType="phone-pad"
                  />
                  <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Organization Website</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter organization website (optional)"
                    value={organizationWebsite}
                    onChangeText={setOrganizationWebsite}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  <Ionicons name="globe-outline" size={20} color="#888" style={styles.inputIcon} />
                </View>
              </View>
            </>
          )}

          {/* Password fields */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.loginText}>
            Already have an account?
            <Text style={styles.loginLink} onPress={() => router.push('/(public)/login')}> Log In</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f8f5', // Light green tint for eco theme
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f8f5', // Light green tint for eco theme
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  roleButtonActive: {
    backgroundColor: '#000',
  },
  roleButtonText: {
    fontWeight: '600',
    color: '#333',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    marginLeft: 10,
  },
  passwordToggle: {
    padding: 8,
  },
  signupButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    color: '#2e7d32', // Dark green
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
    borderRadius: 4,
  },
}); 
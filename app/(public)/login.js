import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import NetworkStatus from '../../components/NetworkStatus';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();
  const { login, user } = useAuth();

  // If user is already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user);
    }
  }, [user]);

  const handleLogin = async () => {
    setError('');
    
    console.log('=== Login Page - Login Attempt ===');
    console.log('Email:', email);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to log in user:', email);
      const userData = await login(email, password);
      
      if (userData) {
        console.log('=== Login Page - Login Successful ===');
        console.log('User data received:', JSON.stringify(userData, null, 2));
        console.log('Original role:', userData.role);
        
        // Ensure role is in uppercase
        if (userData.role) {
          userData.role = userData.role.toUpperCase();
          console.log('Normalized role:', userData.role);
        }
        
        // Redirect based on role immediately after successful login
        redirectBasedOnRole(userData);
      } else {
        console.error('Login failed: No user data returned');
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      email: '',
      password: ''
    };
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Function to handle redirection based on user role
  const redirectBasedOnRole = (user) => {
    console.log('=== Login Page - Redirecting ===');
    console.log('User data:', JSON.stringify(user, null, 2));
    console.log('Original role:', user.role);
    
    // Normalize role to uppercase
    const userRole = user.role?.toUpperCase();
    console.log('Normalized role:', userRole);
    
    switch (userRole) {
      case 'ADMIN':
        console.log('Admin user detected, redirecting to admin dashboard');
        router.replace('/(protected)/admin-dashboard');
        break;
      case 'NGO':
        console.log('NGO user detected, redirecting to NGO dashboard');
        router.replace('/(protected)/ngo-dashboard');
        break;
      default:
        console.log('Regular user detected, redirecting to user dashboard');
        router.replace('/(protected)/dashboard');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Network status indicator for debugging */}
        <NetworkStatus />
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome to EcoHabit</Text>
          <Text style={styles.subtitle}>Log in to manage your eco-friendly journey</Text>
        </View>
        
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, validationErrors.email ? styles.inputError : null]}
                placeholder="Email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validationErrors.email) {
                    setValidationErrors({...validationErrors, email: ''});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {validationErrors.email ? <Text style={styles.fieldError}>{validationErrors.email}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, validationErrors.password ? styles.inputError : null]}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (validationErrors.password) {
                    setValidationErrors({...validationErrors, password: ''});
                  }
                }}
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
            {validationErrors.password ? <Text style={styles.fieldError}>{validationErrors.password}</Text> : null}
          </View>

          <View style={styles.rememberContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe ? styles.checkboxChecked : {}]}>
                {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Forgot password functionality')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={() => alert('Google login')}>
              <Ionicons name="logo-google" size={20} color="#888" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => alert('Apple login')}>
              <Ionicons name="logo-apple" size={20} color="#888" />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.signupText}>New here? <Text style={styles.signupLink} onPress={() => router.push('/(public)/signup')}>Sign up</Text></Text>
          <View style={styles.termsContainer}>
            <TouchableOpacity onPress={() => alert('Terms of Service')}>
              <Text style={styles.termsText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>   </Text>
            <TouchableOpacity onPress={() => alert('Privacy Policy')}>
              <Text style={styles.termsText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    backgroundColor: '#f5f8f5', // Light green tint for eco theme
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: 'red',
  },
  passwordToggle: {
    padding: 8,
  },
  fieldError: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#aaa',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2e7d32', // Dark green
    borderColor: '#2e7d32',
  },
  rememberText: {
    fontSize: 14,
    color: '#666',
  },
  forgotText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    flex: 0.48,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  footerContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  signupLink: {
    color: '#2e7d32', // Dark green
    fontWeight: 'bold',
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#888',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
}); 
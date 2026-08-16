import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('8:00 PM');
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);
  const [language, setLanguage] = useState('English');
  const [measurementUnit, setMeasurementUnit] = useState('Metric');

  const navigateBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(public)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const resetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // In a real app, we would call an API to reset the user's progress
            Alert.alert('Progress Reset', 'Your progress has been reset successfully.');
          },
        },
      ]
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? All your data will be permanently lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, we would call an API to delete the user's account
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
            router.replace('/(public)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container}>
        {/* Notifications Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
                thumbColor={notificationsEnabled ? '#2e7d32' : '#f5f5f5'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="time-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Daily Reminder Time</Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={styles.settingValue}>{reminderTime}</Text>
                <Ionicons name="chevron-forward" size={20} color="#757575" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
                thumbColor={darkModeEnabled ? '#2e7d32' : '#f5f5f5'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="color-palette-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>App Theme</Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={styles.settingValue}>Green</Text>
                <Ionicons name="chevron-forward" size={20} color="#757575" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="language" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Language</Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={styles.settingValue}>{language}</Text>
                <Ionicons name="chevron-forward" size={20} color="#757575" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="options-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Measurement Units</Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={styles.settingValue}>{measurementUnit}</Text>
                <Ionicons name="chevron-forward" size={20} color="#757575" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="analytics-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Share Usage Data</Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={setDataSharing}
                trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
                thumbColor={dataSharing ? '#2e7d32' : '#f5f5f5'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="shield-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="help-circle-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Help & FAQs</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Contact Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="star-outline" size={24} color="#333" style={styles.settingIcon} />
                <Text style={styles.settingText}>Rate the App</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={resetProgress}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="refresh-outline" size={24} color="#ff9800" style={styles.settingIcon} />
                <Text style={[styles.settingText, styles.warningText]}>Reset Progress</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleLogout}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="log-out-outline" size={24} color="#e53935" style={styles.settingIcon} />
                <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={deleteAccount}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="trash-outline" size={24} color="#e53935" style={styles.settingIcon} />
                <Text style={[styles.settingText, styles.deleteText]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionText}>EcoHabit v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2023 EcoHabit Team</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f8f5',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40, // To balance the back button on the left
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
    paddingHorizontal: 4,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#757575',
    marginRight: 4,
  },
  warningText: {
    color: '#ff9800',
  },
  logoutText: {
    color: '#e53935',
  },
  deleteText: {
    color: '#e53935',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9e9e9e',
  },
}); 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../config/constants';
import Storage from '../utils/Storage';
import api from '../config/api';

// Sample achievement data
const ACHIEVEMENTS = [
  {
    id: '1',
    title: 'Recycling Rookie',
    description: 'Completed 7 days of recycling',
    icon: 'leaf',
    unlocked: true,
  },
  {
    id: '2',
    title: 'Water Warrior',
    description: 'Saved 50L of water',
    icon: 'water',
    unlocked: true,
  },
  {
    id: '3',
    title: 'Energy Expert',
    description: 'Reduced energy usage for 30 days',
    icon: 'flash',
    unlocked: false,
  },
  {
    id: '4',
    title: 'Green Champion',
    description: 'Completed all eco challenges',
    icon: 'trophy',
    unlocked: false,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Profile editing state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'User Name',
    email: user?.email || 'user@example.com',
    bio: user?.bio || 'Eco-enthusiast passionate about sustainable living and making a positive impact on our planet.',
    profileImage: user?.profileImage || '',
  });
  const [editedProfileData, setEditedProfileData] = useState({...profileData});
  const [saving, setSaving] = useState(false);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [profileRes, achievementsRes, statsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/api/achievements'),
        api.get('/api/habits/stats')
      ]);

      if (profileRes.data.success) {
        setProfileData({
          name: profileRes.data.data.name,
          email: profileRes.data.data.email,
          bio: profileRes.data.data.bio,
          profileImage: profileRes.data.data.profileImage,
        });
      }

      if (achievementsRes.data.success) {
        setAchievements(achievementsRes.data.data);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update profile data when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || 'User Name',
        email: user.email || 'user@example.com',
        bio: user.bio || 'Eco-enthusiast passionate about sustainable living and making a positive impact on our planet.',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  const handleNotificationsToggle = async (value) => {
    try {
      setNotificationsEnabled(value);
      await Storage.setItem('notifications_enabled', value.toString());
      Alert.alert('Success', `Notifications ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating notifications setting:', error);
      Alert.alert('Error', 'Failed to update notifications setting');
    }
  };

  const handleDarkModeToggle = async (value) => {
    try {
      setDarkModeEnabled(value);
      await Storage.setItem('dark_mode_enabled', value.toString());
      Alert.alert('Success', `Dark mode ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating dark mode setting:', error);
      Alert.alert('Error', 'Failed to update dark mode setting');
    }
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language',
      'Select your preferred language',
      [
        { text: 'English', onPress: () => updateLanguage('en') },
        { text: 'Spanish', onPress: () => updateLanguage('es') },
        { text: 'French', onPress: () => updateLanguage('fr') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const updateLanguage = async (lang) => {
    try {
      await Storage.setItem('language', lang);
      Alert.alert('Success', 'Language updated successfully');
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert('Error', 'Failed to update language');
    }
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Privacy & Data',
      'Manage your privacy settings',
      [
        { text: 'Data Usage', onPress: () => showDataUsageInfo() },
        { text: 'Privacy Policy', onPress: () => showPrivacyPolicy() },
        { text: 'Terms of Service', onPress: () => showTermsOfService() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showDataUsageInfo = () => {
    Alert.alert(
      'Data Usage',
      'We collect and store your habit data, achievements, and profile information to provide you with a personalized experience. Your data is encrypted and stored securely.',
      [{ text: 'OK' }]
    );
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Our privacy policy outlines how we collect, use, and protect your personal information. You can find the full policy on our website.',
      [{ text: 'OK' }]
    );
  };

  const showTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'By using our app, you agree to our terms of service. These terms outline your rights and responsibilities as a user.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'FAQs', onPress: () => showFAQs() },
        { text: 'Contact Support', onPress: () => contactSupport() },
        { text: 'Report a Bug', onPress: () => reportBug() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showFAQs = () => {
    Alert.alert(
      'Frequently Asked Questions',
      'Find answers to common questions about using the app, managing habits, and earning achievements.',
      [{ text: 'OK' }]
    );
  };

  const contactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email us at support@ecohabit.com for assistance.',
      [{ text: 'OK' }]
    );
  };

  const reportBug = () => {
    Alert.alert(
      'Report a Bug',
      'If you encounter any issues, please email us at bugs@ecohabit.com with details about the problem.',
      [{ text: 'OK' }]
    );
  };

  const navigateToHome = () => {
    router.push('/(protected)/dashboard');
  };

  const navigateToStats = () => {
    router.push('/(protected)/stats');
  };

  const navigateToCommunity = () => {
    router.push('/(protected)/community');
  };

  const handleTokenError = () => {
    Alert.alert(
      'Authentication Error',
      'Your session has expired. You need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          onPress: () => handleLogout(true) 
        }
      ]
    );
  };

  const handleLogout = async (tokenReset = false) => {
    try {
      await logout();
      if (tokenReset) {
        router.replace('/(public)/login?resetToken=true');
      } else {
        router.replace('/(public)/login');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEditProfile = () => {
    setEditedProfileData({...profileData});
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const uploadProfileImage = async (uri) => {
    // Get token from storage
    const token = await Storage.getItem('token');
    
    if (!token) {
      handleTokenError();
      return;
    }
    
    setImageUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Get file name from URI
      const fileName = uri.split('/').pop();
      
      // Get file type
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Append file to form data with correct structure
      formData.append('profileImage', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: fileName,
        type,
      });
      
      console.log('Uploading image:', {
        uri,
        fileName,
        type
      });
      
      // Upload image to server with correct headers
      const response = await fetch(`${API_URL}/profile/upload-image`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      
      // Handle authentication errors
      if (response.status === 401) {
        handleTokenError();
        return;
      }
      
      const responseData = await response.json();
      console.log('Upload response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upload image');
      }
      
      if (responseData.success) {
        // Update user in context and local state
        const updatedUser = {...user, profileImage: responseData.data.profileImage};
        setUser(updatedUser);
        setProfileData({...profileData, profileImage: responseData.data.profileImage});
        
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validate input
    if (!editedProfileData.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSaving(true);
    
    try {
      // Get token directly from storage for auth
      const token = await Storage.getItem('token');
      
      if (!token) {
        handleTokenError();
        return;
      }
      
      // Update profile on server
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editedProfileData.name,
          bio: editedProfileData.bio,
        })
      });
      
      // Handle authentication errors
      if (response.status === 401) {
        handleTokenError();
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      if (data.success) {
        // Update local state and context
        setProfileData({...profileData, name: editedProfileData.name, bio: editedProfileData.bio});
        setUser({...user, name: editedProfileData.name, bio: editedProfileData.bio});
        
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Update Failed', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get full image URL
  const getImageUrl = (imageUri) => {
    if (!imageUri) return null;
    
    // If it's already a full URL, return it
    if (imageUri.startsWith('http')) {
      return imageUri;
    }
    
    // Otherwise, prepend the API URL
    return `${API_URL}${imageUri}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" />
          </View>
        ) : (
          <>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                {imageUploading ? (
                  <View style={styles.profileImage}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                  </View>
                ) : profileData.profileImage ? (
                  <Image
                    source={{ uri: getImageUrl(profileData.profileImage) }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={60} color="#ccc" />
                  </View>
                )}
                <View style={styles.editImageButton}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.roleText}>{user?.role || 'User'}</Text>
              </View>
              {profileData.bio && (
                <Text style={styles.profileBio}>{profileData.bio}</Text>
              )}
            </View>

            {/* Stats Overview */}
            <View style={styles.statsOverview}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.streak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.activeHabits || 0}</Text>
                <Text style={styles.statLabel}>Active Habits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{achievements?.earnedBadges || 0}</Text>
                <Text style={styles.statLabel}>Achievements</Text>
              </View>
            </View>

            {/* Achievements Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.achievementsContainer}>
                {achievements?.categories.map((category) => (
                  category.badges.map((badge) => (
                    <View 
                      key={badge.id} 
                      style={[
                        styles.achievementCard,
                        !badge.unlocked && styles.achievementCardLocked
                      ]}
                    >
                      <View 
                        style={[
                          styles.achievementIconContainer,
                          !badge.unlocked && styles.achievementIconContainerLocked
                        ]}
                      >
                        <Ionicons 
                          name={badge.icon} 
                          size={24} 
                          color={badge.unlocked ? '#2e7d32' : '#bdbdbd'} 
                        />
                      </View>
                      <Text 
                        style={[
                          styles.achievementTitle,
                          !badge.unlocked && styles.achievementTitleLocked
                        ]}
                      >
                        {badge.title}
                      </Text>
                      <Text 
                        style={[
                          styles.achievementDescription,
                          !badge.unlocked && styles.achievementDescriptionLocked
                        ]}
                      >
                        {badge.description}
                      </Text>
                      {!badge.unlocked && (
                        <View style={styles.lockIconContainer}>
                          <Ionicons name="lock-closed" size={16} color="#bdbdbd" />
                        </View>
                      )}
                    </View>
                  ))
                ))}
              </View>
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.settingsContainer}>
                {/* Notifications Setting */}
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="notifications-outline" size={24} color="#333" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Notifications</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationsToggle}
                    trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
                    thumbColor={notificationsEnabled ? '#2e7d32' : '#f5f5f5'}
                  />
                </View>

                {/* Dark Mode Setting */}
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="moon-outline" size={24} color="#333" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Dark Mode</Text>
                  </View>
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={handleDarkModeToggle}
                    trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
                    thumbColor={darkModeEnabled ? '#2e7d32' : '#f5f5f5'}
                  />
                </View>

                {/* Language Setting */}
                <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="language" size={24} color="#333" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Language</Text>
                  </View>
                  <View style={styles.settingAction}>
                    <Text style={styles.settingValue}>English</Text>
                    <Ionicons name="chevron-forward" size={20} color="#757575" />
                  </View>
                </TouchableOpacity>

                {/* Privacy Setting */}
                <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="shield-outline" size={24} color="#333" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Privacy & Data</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#757575" />
                </TouchableOpacity>

                {/* Help & Support Setting */}
                <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="help-circle-outline" size={24} color="#333" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Help & Support</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#757575" />
                </TouchableOpacity>
              </View>

              {/* Logout Button */}
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#e53935" style={styles.logoutIcon} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.editProfileContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editFormContainer}>
              {/* Profile Image */}
              <View style={styles.modalImageContainer}>
                <TouchableOpacity style={styles.modalProfileImage} onPress={pickImage}>
                  {imageUploading ? (
                    <View style={styles.modalProfileImagePlaceholder}>
                      <ActivityIndicator size="large" color="#2e7d32" />
                    </View>
                  ) : profileData.profileImage ? (
                    <Image
                      source={{ uri: getImageUrl(profileData.profileImage) }}
                      style={styles.modalProfileImageContent}
                    />
                  ) : (
                    <View style={styles.modalProfileImagePlaceholder}>
                      <Ionicons name="person" size={50} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.modalEditImageButton}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </View>
              
              {/* Name Input */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfileData.name}
                  onChangeText={(text) => setEditedProfileData({...editedProfileData, name: text})}
                  placeholder="Your name"
                />
              </View>

              {/* Bio Input */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editedProfileData.bio}
                  onChangeText={(text) => setEditedProfileData({...editedProfileData, bio: text})}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(protected)/dashboard')}>
          <Ionicons name="home-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(protected)/stats')}>
          <Ionicons name="stats-chart-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(protected)/achievements')}>
          <Ionicons name="trophy-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Achievements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(protected)/community')}>
          <Ionicons name="people-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Community</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#2e7d32" />
          <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#2e7d32',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 60,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#2e7d32',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  roleContainer: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  roleText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  statsOverview: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  achievementCardLocked: {
    backgroundColor: '#f5f5f5',
    opacity: 0.8,
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIconContainerLocked: {
    backgroundColor: '#f0f0f0',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#9e9e9e',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementDescriptionLocked: {
    color: '#bdbdbd',
  },
  lockIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#e53935',
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: '#757575',
  },
  navTextActive: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  profileBio: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editProfileContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editFormContainer: {
    maxHeight: '90%',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    fontSize: 16,
  },
  bioInput: {
    textAlignVertical: 'top',
    height: 100,
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 10,
  },
  modalImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8,
  },
  modalProfileImageContent: {
    width: '100%',
    height: '100%',
  },
  modalProfileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEditImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
}); 
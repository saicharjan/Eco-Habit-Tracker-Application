import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, RefreshControl, ScrollView, TextInput, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '../config/constants';
import { useRouter } from 'expo-router';
import NetworkStatus from '../../components/NetworkStatus';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'posts'
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserFormVisible, setIsUserFormVisible] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User',
  });
  const [formErrors, setFormErrors] = useState({});

  // Verify admin access and redirect if not admin
  useEffect(() => {
    console.log('=== Admin Dashboard Access Check ===');
    console.log('User:', user ? JSON.stringify(user, null, 2) : 'No user');
    console.log('User role:', user?.role);

    if (!user || !token) {
      console.log('No user or token found, redirecting to login');
      router.replace('/(public)/login');
      return;
    }

    const userRole = user.role?.toUpperCase();
    console.log('Normalized user role:', userRole);

    if (userRole !== 'ADMIN') {
      console.log('Non-admin user attempted to access admin dashboard');
      Alert.alert(
        'Access Denied',
        'You do not have admin privileges.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Redirecting to user dashboard');
              router.replace('/(protected)/dashboard');
            }
          }
        ]
      );
      return;
    }

    console.log('Admin access verified, loading dashboard data');
    fetchUsers();
    fetchPosts();
  }, [user, token]);

  const fetchUsers = async () => {
    setError(null);
    try {
      console.log('Fetching users with token:', token ? `${token.substring(0, 10)}...` : 'No token');
      
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Users API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        // Try to parse as JSON if possible
        let errorMessage = 'Failed to fetch users';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response as JSON:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Get response as text first to debug any parsing issues
      const responseText = await response.text();
      console.log('Response text preview:', responseText.substring(0, 100));
      
      // Then parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response not valid JSON, first 100 chars:', responseText.substring(0, 100));
        throw new Error('Invalid JSON response from server');
      }
      
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to fetch users: ${error.message}`);
      // Don't show alert to avoid annoying the user
      // Alert.alert('Error', `Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPosts = async () => {
    setError(null);
    try {
      console.log('Fetching posts with token:', token ? `${token.substring(0, 10)}...` : 'No token');
      
      const response = await fetch(`${API_URL}/api/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Posts API response status:', response.status);
      
      // Check if the response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        // Try to parse as JSON if possible
        let errorMessage = 'Failed to fetch posts';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response as JSON:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Get response as text first to debug any parsing issues
      const responseText = await response.text();
      console.log('Response text preview:', responseText.substring(0, 100));
      
      // Then parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response not valid JSON, first 100 chars:', responseText.substring(0, 100));
        throw new Error('Invalid JSON response from server');
      }
      
      setPosts(data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(`Failed to fetch posts: ${error.message}`);
      // Don't show alert to avoid annoying the user
      // Alert.alert('Error', `Failed to fetch posts: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPosts();
    }
  };

  const handleUserStatusChange = async (userId, makeActive) => {
    try {
      const endpoint = makeActive ? 'activate' : 'deactivate';
      
      const response = await fetch(`${API_URL}/users/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${makeActive ? 'activate' : 'deactivate'} user`);
      }
      
      // Update local state to reflect the change
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: makeActive } : user
      ));
      
      Alert.alert(
        'Success', 
        `User ${makeActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error(`Error ${makeActive ? 'activating' : 'deactivating'} user:`, error);
      Alert.alert('Error', error.message);
    }
  };

  const handleCreateUser = async () => {
    // Validate form
    const errors = {};
    if (!newUser.name) errors.name = 'Name is required';
    if (!newUser.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(newUser.email)) errors.email = 'Email is invalid';
    if (!newUser.password) errors.password = 'Password is required';
    else if (newUser.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const data = await response.json();
      
      // Add the new user to the state
      setUsers([...users, data.data]);
      
      // Reset form and close modal
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'User',
      });
      setFormErrors({});
      setIsUserFormVisible(false);
      
      Alert.alert('Success', 'User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(public)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.user && post.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMetadata}>
          <Text style={[styles.userRole, getRoleStyle(item.role)]}>{item.role}</Text>
          <Text style={[
            styles.userStatus, 
            { color: item.isActive ? 'green' : 'red' }
          ]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.userActions}>
        {item.isActive ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.deactivateButton]}
            onPress={() => handleUserStatusChange(item._id, false)}
          >
            <MaterialIcons name="person-off" size={18} color="white" />
            <Text style={styles.actionButtonText}>Deactivate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handleUserStatusChange(item._id, true)}
          >
            <MaterialIcons name="person" size={18} color="white" />
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPostItem = ({ item }) => (
    <View style={styles.postItem}>
      <View style={styles.postHeader}>
        <Text style={styles.postAuthor}>{item.user?.name || 'Unknown User'}</Text>
        <Text style={styles.postTime}>{item.timeAgo}</Text>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.image && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Has image attachment</Text>
        </View>
      )}
      <View style={styles.postStats}>
        <Text style={styles.postStat}>
          <Ionicons name="heart" size={14} color="#888" /> {item.likes}
        </Text>
        <Text style={styles.postStat}>
          <Ionicons name="chatbubble" size={14} color="#888" /> {item.comments}
        </Text>
      </View>
    </View>
  );

  const getRoleStyle = (role) => {
    switch (role) {
      case 'Admin':
        return { color: 'red' };
      case 'NGO':
        return { color: 'blue' };
      default:
        return { color: 'green' };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NetworkStatus />
      
      <View style={styles.header}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage users and content</Text>
          </View>
          <TouchableOpacity 
            style={{
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: '#ffebee',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
            <Text style={{marginLeft: 8, color: '#d32f2f', fontWeight: 'bold'}}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => {
            setActiveTab('users');
            setError(null);
          }}
        >
          <MaterialIcons 
            name="people" 
            size={20} 
            color={activeTab === 'users' ? '#2e7d32' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => {
            setActiveTab('posts');
            setError(null);
          }}
        >
          <MaterialIcons 
            name="article" 
            size={20} 
            color={activeTab === 'posts' ? '#2e7d32' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {activeTab === 'users' && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsUserFormVisible(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>New User</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'users' ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              {activeTab === 'users' && error ? (
                <>
                  <Text style={styles.emptyListText}>
                    Could not load users. Please try again.
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => fetchUsers()}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyListText}>No users found</Text>
              )}
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id || item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              {activeTab === 'posts' && error ? (
                <>
                  <Text style={styles.emptyListText}>
                    Could not load posts. Please try again.
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => fetchPosts()}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyListText}>No posts found</Text>
              )}
            </View>
          }
        />
      )}

      {/* New User Modal */}
      <Modal
        visible={isUserFormVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsUserFormVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsUserFormVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New User</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={[styles.formInput, formErrors.name && styles.inputError]}
                  value={newUser.name}
                  onChangeText={(text) => {
                    setNewUser({...newUser, name: text});
                    if (formErrors.name) {
                      setFormErrors({...formErrors, name: null});
                    }
                  }}
                  placeholder="Full Name"
                />
                {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={[styles.formInput, formErrors.email && styles.inputError]}
                  value={newUser.email}
                  onChangeText={(text) => {
                    setNewUser({...newUser, email: text});
                    if (formErrors.email) {
                      setFormErrors({...formErrors, email: null});
                    }
                  }}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Password</Text>
                <TextInput
                  style={[styles.formInput, formErrors.password && styles.inputError]}
                  value={newUser.password}
                  onChangeText={(text) => {
                    setNewUser({...newUser, password: text});
                    if (formErrors.password) {
                      setFormErrors({...formErrors, password: null});
                    }
                  }}
                  placeholder="Password"
                  secureTextEntry
                />
                {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role</Text>
                <View style={styles.roleButtonsContainer}>
                  {['User', 'NGO', 'Admin'].map(role => (
                    <TouchableOpacity 
                      key={role}
                      style={[
                        styles.roleButton,
                        newUser.role === role && styles.roleButtonActive
                      ]}
                      onPress={() => setNewUser({...newUser, role})}
                    >
                      <Text 
                        style={[
                          styles.roleButtonText,
                          newUser.role === role && styles.roleButtonTextActive
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsUserFormVisible(false);
                    setFormErrors({});
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleCreateUser}
                >
                  <Text style={styles.saveButtonText}>Create User</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8f5',
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2e7d32',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#f1f1f1',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  userStatus: {
    fontSize: 12,
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deactivateButton: {
    backgroundColor: '#d32f2f',
  },
  activateButton: {
    backgroundColor: '#2e7d32',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  postItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  imageContainer: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  imageLabel: {
    color: '#666',
    fontSize: 12,
  },
  postStats: {
    flexDirection: 'row',
  },
  postStat: {
    fontSize: 12,
    color: '#888',
    marginRight: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyList: {
    padding: 24,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#888',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#555',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  roleButtonActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  roleButtonText: {
    color: '#666',
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 4,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 
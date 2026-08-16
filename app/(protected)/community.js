import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/constants';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Sample community posts data
const COMMUNITY_POSTS = [
  {
    id: '1',
    user: {
      name: 'Jane Cooper',
      avatar: 'https://randomuser.me/api/portraits/women/10.jpg',
      role: 'User',
    },
    content: "Just completed my 15th day of recycling! It feels amazing to know I'm making a difference. Does anyone have tips for recycling paper products more efficiently?",
    image: 'https://images.unsplash.com/photo-1611284446314-9baa9449e8d1',
    likes: 24,
    comments: 8,
    timeAgo: '2h ago',
    liked: false,
  },
  {
    id: '2',
    user: {
      name: 'GreenEarth NGO',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      role: 'NGO',
    },
    content: "We're organizing a tree planting event this Saturday at Central Park! Join us in our mission to make our city greener. Sign up through the link in our profile.",
    image: 'https://images.unsplash.com/photo-1513264603993-d81126e4d2e1',
    likes: 56,
    comments: 12,
    timeAgo: '5h ago',
    liked: true,
  },
  {
    id: '3',
    user: {
      name: 'Robert Thompson',
      avatar: 'https://randomuser.me/api/portraits/men/20.jpg',
      role: 'User',
    },
    content: "My water-saving habit is showing results! Cut my water bill by 20% this month. Small changes really do add up!",
    image: null,
    likes: 18,
    comments: 5,
    timeAgo: '1d ago',
    liked: false,
  },
];

// Sample challenge data
const COMMUNITY_CHALLENGES = [
  {
    id: '1',
    title: '30-Day Recycling Challenge',
    participants: 1289,
    daysLeft: 12,
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
  },
  {
    id: '2',
    title: 'Water Conservation Sprint',
    participants: 756,
    daysLeft: 5,
    image: 'https://images.unsplash.com/photo-1544476915-ed1370594142',
  },
  {
    id: '3',
    title: 'Plant a Tree Week',
    participants: 432,
    daysLeft: 2,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09',
  },
];

export default function CommunityScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentList, setCommentList] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch posts when component mounts
  useEffect(() => {
    if (token) {
      fetchPosts();
    }
  }, [token]);

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    Alert.alert(
      'Session Expired',
      'Your login session has expired. Please log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          onPress: () => logout() 
        }
      ]
    );
  }, [logout]);

  // Pull to refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching posts from:', `${API_URL}/api/posts`);
      
      // Make sure we have the authorization header
      if (!token) {
        console.warn('No auth token available for fetching posts');
        setPosts([]);
        setIsLoading(false);
        Alert.alert('Authentication Error', 'Please log in to view posts');
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log('Using auth token:', token ? token.substring(0, 15) + '...' : 'No token');
      console.log('Full headers:', JSON.stringify(config.headers));
      
      const response = await axios.get(`${API_URL}/api/posts`, config);
      
      console.log('Response received:', response.status);
      
      if (response.data && response.data.success) {
        console.log(`Received ${response.data.data.length} posts`);
        setPosts(response.data.data);
        
        // Organize comments by post ID
        const commentsMap = {};
        response.data.data.forEach(post => {
          if (post.comments && post.comments.length > 0) {
            commentsMap[post.id] = post.comments;
          }
        });
        
        setCommentList(commentsMap);
      } else {
        console.error('Received unsuccessful response:', response.data);
        setPosts([]); // Set empty posts array on error
        Alert.alert('Error', 'Failed to load posts. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Response error status:', error.response.status);
        console.error('Response error data:', JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      setPosts([]); // Set empty posts array on error
      
      if (error.response && error.response.status === 401) {
        handleSessionExpired();
      } else {
        Alert.alert(
          'Error Loading Posts', 
          'Could not load community posts. Please check your connection and try again.',
          [
            {
              text: 'Try Again',
              onPress: () => fetchPosts()
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToHome = () => {
    router.push('/(protected)/dashboard');
  };

  const navigateToStats = () => {
    router.push('/(protected)/stats');
  };

  const navigateToProfile = () => {
    router.push('/(protected)/profile');
  };

  const toggleLike = async (postId) => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in again to interact with posts.');
      return;
    }

    try {
      // Optimistic update
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const liked = !post.liked;
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : post.likes - 1,
        };
      }
      return post;
    }));

      // Send request to server
      const response = await axios.put(
        `${API_URL}/api/posts/${postId}/like`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // If the request fails, revert the optimistic update
      if (!response.data.success) {
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            const liked = !post.liked;
            return {
              ...post,
              liked,
              likes: liked ? post.likes + 1 : post.likes - 1,
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      if (error.response && error.response.status === 401) {
        handleSessionExpired();
      } else {
        Alert.alert('Error', 'Failed to update like. Please try again.');
      }
      
      // Revert optimistic update on error
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const liked = !post.liked;
          return {
            ...post,
            liked,
            likes: liked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      }));
    }
  };

  const handleJoinChallenge = (challengeId) => {
    // In a real app, this would connect to a backend
    alert(`Joined challenge ${challengeId}! Check your active habits to track progress.`);
  };

  // Get full image URL
  const getImageUrl = (imageUri) => {
    if (!imageUri) return null;
    
    // If it's already a full URL, return it
    if (imageUri.startsWith('http')) {
      return imageUri;
    }
    
    // All server paths should start with a slash
    let normalizedUri = imageUri;
    if (!normalizedUri.startsWith('/') && !normalizedUri.startsWith('http')) {
      normalizedUri = '/' + normalizedUri;
    }
    
    // Create the full URL by joining the API_URL and the path
    const fullUrl = `${API_URL}${normalizedUri}`;
    return fullUrl;
  };

  const renderUserAvatar = (user) => {
    if (!user || !user.avatar) {
      return (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={24} color="#ccc" />
        </View>
      );
    }

    const avatarUrl = getImageUrl(user.avatar);
    
    return (
      <Image 
        source={{ uri: avatarUrl }} 
        style={styles.avatar}
      />
    );
  };

  const pickImage = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      console.log('ImagePicker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage.uri);
        
        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(selectedImage.uri);
        console.log('File info:', fileInfo);
        
        // Limit file size to 10MB
        if (fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('Image too large', 'Please select an image smaller than 10MB');
          return;
        }
        
        // Set the image URI to state
        setPostImage(selectedImage.uri);
        console.log('Image set to state:', selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCreatePost = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in again to create a post.');
      return;
    }

    if (!newPostContent.trim()) {
      Alert.alert('Post cannot be empty', 'Please add some content to your post.');
      return;
    }

    setIsPosting(true);

    try {
      console.log('Creating post with user:', user);
      
      // Create form data for mixed content (text + image)
      const formData = new FormData();
      formData.append('content', newPostContent);
      
      // If there's an image, add it to form data
      if (postImage) {
        // Get file extension
        const fileExtension = postImage.split('.').pop();
        const fileName = `post_image_${Date.now()}.${fileExtension}`;
        
        // Add image to form data
        formData.append('image', {
          uri: postImage,
          name: fileName,
          type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
        });
        
        console.log('Adding image to post:', fileName);
      }
      
      console.log('Sending post with formData:', Object.fromEntries(formData._parts));
      
      const response = await axios.post(
        `${API_URL}/api/posts`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data && response.data.success) {
        console.log('Post created successfully:', response.data);
        
        // The backend now sends a properly formatted post object
        const newPost = response.data.data;
        
        // Add the new post to the posts list
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setPostImage(null);
      setPostModalVisible(false);
      } else {
        console.error('Received unsuccessful response:', response.data);
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
      }
      
      if (error.response && error.response.status === 401) {
        handleSessionExpired();
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } finally {
      setIsPosting(false);
    }
  };

  const openCommentModal = (postId) => {
    setSelectedPostId(postId);
    setCommentModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in again to add a comment.');
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Comment cannot be empty', 'Please enter a comment.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/posts/${selectedPostId}/comment`,
        { text: newComment },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
    // Update comment list
        const newCommentData = response.data.data;
        
    setCommentList(prevComments => {
          const updatedComments = { ...prevComments };
          
          if (!updatedComments[selectedPostId]) {
            updatedComments[selectedPostId] = [];
          }
          
          updatedComments[selectedPostId] = [
            {
              id: newCommentData.id,
              user: newCommentData.user.name,
              avatar: newCommentData.user.avatar,
              text: newCommentData.text,
              timeAgo: newCommentData.timeAgo
            },
            ...updatedComments[selectedPostId]
          ];
          
          return updatedComments;
        });

        // Update comment count in posts
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === selectedPostId) {
            return {
              ...post,
              comments: post.comments + 1
            };
          }
          return post;
        }));

        // Clear comment input
        setNewComment('');
      } else {
        console.error('Received unsuccessful response:', response.data);
        Alert.alert('Error', 'Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response && error.response.status === 401) {
        handleSessionExpired();
      } else {
        Alert.alert('Error', 'Failed to add comment. Please try again.');
      }
    }
  };

  const removeImage = () => {
    setPostImage(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2e7d32']}
            tintColor={'#2e7d32'}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts and challenges..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.challengesScrollView}
          >
            {COMMUNITY_CHALLENGES.map(challenge => (
              <View key={challenge.id} style={styles.challengeCard}>
                <Image
                  source={{ uri: challenge.image }}
                  style={styles.challengeImage}
                />
                <View style={styles.challengeContent}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeParticipants}>
                    {challenge.participants.toLocaleString()} participants
                  </Text>
                  <View style={styles.challengeFooter}>
                    <Text style={styles.challengeDaysLeft}>
                      {challenge.daysLeft} days left
                    </Text>
                    <TouchableOpacity 
                      style={styles.joinButton}
                      onPress={() => handleJoinChallenge(challenge.id)}
                    >
                      <Text style={styles.joinButtonText}>Join</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Community Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community Feed</Text>
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => setPostModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7d32" />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share something with the community!</Text>
            </View>
          ) : (
            posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatarContainer}>
                      {renderUserAvatar(post.user)}
                    {post.user.role === 'NGO' && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
                      </View>
                    )}
                  </View>
                  <View style={styles.userTextInfo}>
                    <Text style={styles.userName}>{post.user.name}</Text>
                    <Text style={styles.postTime}>{post.timeAgo}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.image && (
                <View style={styles.postImageContainer}>
                  <Image 
                    source={{ uri: getImageUrl(post.image) }} 
                    style={styles.postImage} 
                    resizeMode="cover"
                  />
                </View>
              )}

              <View style={styles.postActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => toggleLike(post.id)}
                >
                  <Ionicons 
                    name={post.liked ? "heart" : "heart-outline"} 
                    size={22} 
                    color={post.liked ? "#e74c3c" : "#666"} 
                  />
                  <Text 
                    style={[
                      styles.actionText, 
                      post.liked && styles.likedText
                    ]}
                  >
                    {post.likes}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => openCommentModal(post.id)}
                >
                  <Ionicons name="chatbubble-outline" size={22} color="#666" />
                  <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-social-outline" size={22} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* New Post Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.postModalContent}>
            <View style={styles.postModalHeader}>
              <Text style={styles.postModalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#999"
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
            />

            {postImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: postImage }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.postModalActions}>
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={24} color="#2e7d32" />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.postButton,
                  !newPostContent.trim() && styles.postButtonDisabled
                ]}
                onPress={handleCreatePost}
                disabled={!newPostContent.trim() || isPosting}
              >
                {isPosting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.commentsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {selectedPostId && commentList[selectedPostId] ? (
                commentList[selectedPostId].map(comment => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{comment.user}</Text>
                      <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
              )}
            </ScrollView>

            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={navigateToHome}>
          <Ionicons name="home-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={navigateToStats}>
          <Ionicons name="stats-chart-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(protected)/achievements')}>
          <Ionicons name="trophy-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Achievements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={24} color="#2e7d32" />
          <Text style={[styles.navText, styles.navTextActive]}>Community</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={navigateToProfile}>
          <Ionicons name="person-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Profile</Text>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  createPostButton: {
    backgroundColor: '#2e7d32',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengesScrollView: {
    marginBottom: 8,
  },
  challengeCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  challengeImage: {
    width: '100%',
    height: 120,
  },
  challengeContent: {
    padding: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  challengeParticipants: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeDaysLeft: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  postTime: {
    fontSize: 12,
    color: '#999',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  postImageContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  likedText: {
    color: '#e74c3c',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  postModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  postModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  postInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    color: '#333',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  postModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addImageText: {
    marginLeft: 8,
    color: '#2e7d32',
    fontWeight: '500',
  },
  postButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#c5e1c5',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  commentsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  commentsList: {
    maxHeight: 300,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#2e7d32',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#c5e1c5',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
}); 
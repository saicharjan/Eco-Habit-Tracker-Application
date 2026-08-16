import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  Switch,
  RefreshControl,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ActivityCard from '../../components/ActivityCard';
import StatisticsCard from '../../components/StatisticsCard';
import ChallengesCard from '../../components/ChallengesCard';
import NetworkStatus from '../../components/NetworkStatus';
import api from '../config/api';

// Predefined habit data
const PREDEFINED_HABITS = [
  {
    id: '1',
    name: 'Daily Recycling',
    icon: 'recycle',
    iconType: 'material',
    description: 'Separate waste daily',
    category: 'recycle',
    challenges: [
      'Recycle plastic bottles',
      'Sort paper waste',
      'Separate glass items'
    ]
  },
  {
    id: '2',
    name: 'Water Conservation',
    icon: 'water',
    iconType: 'ionicons',
    description: 'Save 2L water per day',
    category: 'water',
    challenges: [
      'Take shorter showers',
      'Fix leaky faucets',
      'Use water-saving mode'
    ]
  },
  {
    id: '3',
    name: 'Energy Saving',
    icon: 'flash',
    iconType: 'ionicons',
    description: 'Turn off unused devices',
    category: 'energy',
    challenges: [
      'Unplug chargers when not in use',
      'Use LED light bulbs',
      'Turn off lights when leaving a room'
    ]
  },
  {
    id: '4',
    name: 'Plant Trees',
    icon: 'tree',
    iconType: 'font-awesome',
    description: 'Plant one tree per month',
    category: 'plants',
    challenges: [
      'Research native tree species',
      'Prepare planting area',
      'Water newly planted trees'
    ]
  },
  {
    id: '5',
    name: 'Green Transport',
    icon: 'bicycle',
    iconType: 'font-awesome',
    description: 'Use bike or public transport',
    category: 'energy',
    challenges: [
      'Plan bike routes',
      'Check public transit schedules',
      'Track carbon emissions saved'
    ]
  },
  {
    id: '6',
    name: 'Zero Waste Shopping',
    icon: 'shopping-bag',
    iconType: 'feather',
    description: 'Use reusable bags',
    category: 'recycle',
    challenges: [
      'Bring your own containers',
      'Avoid plastic packaging',
      'Shop at bulk stores'
    ]
  }
];

const HABIT_CATEGORIES = [
  { id: 'recycle', name: 'Recycle', icon: 'recycle', iconType: 'material', color: '#4CAF50' },
  { id: 'water', name: 'Water', icon: 'water', iconType: 'ionicons', color: '#2196F3' },
  { id: 'energy', name: 'Energy', icon: 'flash', iconType: 'ionicons', color: '#FFC107' },
  { id: 'plants', name: 'Plants', icon: 'leaf', iconType: 'font-awesome', color: '#8BC34A' }
];

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeHabits, setActiveHabits] = useState([]);
  const [streak, setStreak] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // New state for custom habit creation
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isAddChallengeModalVisible, setIsAddChallengeModalVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [newChallenge, setNewChallenge] = useState('');
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    challenges: '',
    frequency: 'Daily',
    enableReminders: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedHabitId, setCelebratedHabitId] = useState(null);
  const celebrationAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const [animatingChallenges, setAnimatingChallenges] = useState({});
  const [animatingProgress, setAnimatingProgress] = useState({});

  // Load active habits from backend
  const loadActiveHabits = async () => {
    try {
      const response = await api.get('/api/habits/active');
      if (response.data.success) {
        const habitsWithProgress = await Promise.all(
          response.data.data.map(async (habit) => {
            try {
              // Get progress data for this habit
              const progressResponse = await api.get(`/api/habits/${habit._id}/progress`);
              
              // Create todaysChallenges array from habit challenges with completion status
              const todaysChallenges = habit.challenges.map((challenge, index) => {
                const challengeId = index.toString();
                const isCompleted = progressResponse.data.data.completedChallenges?.some(
                  c => c.challengeId === challengeId
                ) || false;
                
                return {
                  id: challengeId,
                  text: typeof challenge === 'string' ? challenge : challenge.text,
                  completed: isCompleted
                };
              });
              
              return {
                ...habit,
                id: habit._id, // Ensure id is available for comparison
                progress: progressResponse.data.data.streak?.current || 0,
                todaysChallenges
              };
            } catch (progressError) {
              console.error(`Error loading progress for habit ${habit._id}:`, progressError);
              
              // Return habit with default values if progress can't be loaded
              return {
                ...habit,
                id: habit._id,
                progress: 0,
                todaysChallenges: habit.challenges.map((challenge, index) => ({
                  id: index.toString(),
                  text: typeof challenge === 'string' ? challenge : challenge.text,
                  completed: false
                }))
              };
            }
          })
        );
        setActiveHabits(habitsWithProgress);
        
        // Load streak data
        try {
          const streakResponse = await api.get('/api/habits/stats');
          if (streakResponse.data.success) {
            // Calculate total streak from all habits
            const totalStreak = Object.values(streakResponse.data.data.streaks)
              .reduce((total, streak) => total + (streak.current || 0), 0);
            
            setStreak(totalStreak);
          }
        } catch (streakError) {
          console.error('Error loading streak data:', streakError);
        }
      }
    } catch (error) {
      console.error('Error loading active habits:', error);
      // Show error message to user
      Alert.alert(
        'Error',
        'Failed to load active habits. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Load predefined habits
  const loadPredefinedHabits = async () => {
    try {
      const response = await api.get('/api/habits/predefined');
      if (response.data.success) {
        setFilteredHabits(response.data.data);
      }
    } catch (error) {
      console.error('Error loading predefined habits from API:', error);
      console.log('Falling back to local predefined habits');
      
      // Fall back to local predefined habits
      setFilteredHabits(PREDEFINED_HABITS);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadActiveHabits(), loadPredefinedHabits()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadActiveHabits(), loadPredefinedHabits()]);
    setRefreshing(false);
  }, []);

  // Add habit to active habits
  const addHabitToActive = async (habit) => {
    try {
    // Check if habit is already active
    if (activeHabits.find(h => h.id === habit.id)) {
      return;
    }

      // For predefined habits, we need to create a new habit in the database
      // rather than trying to activate a non-existent one
      if (PREDEFINED_HABITS.some(h => h.id === habit.id)) {
        // Create a new habit based on the predefined one
        const response = await api.post('/api/habits', {
          name: habit.name,
          description: habit.description,
          challenges: habit.challenges.map(challenge => ({ text: challenge })),
          category: habit.category,
          icon: habit.icon,
          iconType: habit.iconType,
          isCustom: false,
          isActive: true,
          frequency: 'daily'
        });

        if (response.data.success) {
          // Reload active habits to get the latest data
          await loadActiveHabits();
        }
      } else {
        // For existing habits, activate them
        const response = await api.post(`/api/habits/${habit._id}/activate`);
        if (response.data.success) {
          // Reload active habits to get the latest data
          await loadActiveHabits();
        }
      }
    } catch (error) {
      console.error('Error activating habit:', error);
      // Show error message to user
      Alert.alert(
        'Error',
        'Failed to add habit. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Remove active habit
  const removeActiveHabit = async (habitId) => {
    try {
      const response = await api.post(`/api/habits/${habitId}/deactivate`);
      if (response.data.success) {
        // Reload active habits to get the latest data
        await loadActiveHabits();
      }
    } catch (error) {
      console.error('Error deactivating habit:', error);
    }
  };

  // Create custom habit
  const createCustomHabit = async () => {
    // Validate form
    const errors = {};
    if (!newHabit.name.trim()) {
      errors.name = 'Habit name is required';
    }
    if (!newHabit.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Format challenges as objects with text and points
      const formattedChallenges = newHabit.challenges
        .split('\n')
        .filter(challenge => challenge.trim())
        .map(challenge => ({
          text: challenge.trim(),
          points: 10 // Default points for each challenge
        }));

      // Create habit in backend
      const response = await api.post('/api/habits', {
        name: newHabit.name.trim(),
        description: newHabit.description.trim(),
        challenges: formattedChallenges,
        category: 'custom', // Set category as custom for user-created habits
        icon: 'create-outline', // Default icon for custom habits
        iconType: 'ionicons',
        isCustom: true,
        isActive: true,
        frequency: newHabit.frequency.toLowerCase()
      });

      if (response.data.success) {
        // Reload active habits to get the latest data
        await loadActiveHabits();
        
        // Reset form and close modal
        setNewHabit({
          name: '',
          description: '',
          challenges: '',
          frequency: 'Daily',
          enableReminders: false
        });
        setFormErrors({});
        setIsCreateModalVisible(false);

        // Show success message
        Alert.alert(
          'Success',
          'Habit created successfully!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error creating habit:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create habit. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(public)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const addChallenge = (habitId) => {
    setSelectedHabitId(habitId);
    setNewChallenge('');
    setIsAddChallengeModalVisible(true);
  };

  const handleAddChallenge = async () => {
    if (!newChallenge.trim()) {
      alert('Please enter a challenge');
      return;
    }

    try {
      // First update the UI optimistically
      const updatedHabits = activeHabits.map(habit => {
        if (habit.id === selectedHabitId || habit._id === selectedHabitId) {
        // Create a new challenge
        const newChallengeObj = {
          id: `custom-${Date.now()}`,
          text: newChallenge.trim(),
          completed: false
        };
        
        // Add to existing challenges
        const updatedChallenges = [...habit.todaysChallenges, newChallengeObj];
        
        // Recalculate progress (now with one more incomplete challenge)
        const completedCount = updatedChallenges.filter(c => c.completed).length;
        const progress = Math.round((completedCount / updatedChallenges.length) * 100);
        
        return {
          ...habit,
          todaysChallenges: updatedChallenges,
          progress
        };
      }
      return habit;
      });
      
      setActiveHabits(updatedHabits);
      
      // Find the updated habit
      const updatedHabit = updatedHabits.find(h => h.id === selectedHabitId || h._id === selectedHabitId);
      if (!updatedHabit) return;
      
      // Save the new challenge to the backend
      const response = await api.put(`/api/habits/${selectedHabitId}`, {
        challenges: updatedHabit.todaysChallenges.map(c => ({ text: c.text }))
      });
      
      if (response.data.success) {
    // Close modal and reset
    setIsAddChallengeModalVisible(false);
    setNewChallenge('');
      }
    } catch (error) {
      console.error('Error adding challenge:', error);
      // Show error message to user
      Alert.alert(
        'Error',
        'Failed to add challenge. Please try again later.',
        [{ text: 'OK' }]
      );
      
      // Reload habits to ensure UI is in sync with backend
      await loadActiveHabits();
    }
  };

  // Animation for celebration
  const startCelebrationAnimation = () => {
    setShowCelebration(true);
    
    // Reset animation values
    celebrationAnimation.setValue(0);
    confettiAnimation.setValue(0);
    
    // Animate celebration modal
    Animated.sequence([
      Animated.timing(celebrationAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.delay(2000),
      Animated.timing(celebrationAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowCelebration(false);
    });
    
    // Animate confetti
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(confettiAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const toggleChallengeCompletion = async (habitId, challengeId) => {
    try {
      // Find the current habit and challenge
      const currentHabit = activeHabits.find(h => h.id === habitId || h._id === habitId);
      if (!currentHabit) {
        console.error('Habit not found:', habitId);
        return;
      }

      const currentChallenge = currentHabit.todaysChallenges.find(c => c.id === challengeId);
      if (!currentChallenge) {
        console.error('Challenge not found:', challengeId);
        return;
      }

      // Store the new completion state
      const newCompletionState = !currentChallenge.completed;

      // First update the UI optimistically
      const updatedHabits = activeHabits.map(habit => {
        if (habit.id === habitId || habit._id === habitId) {
        const updatedChallenges = habit.todaysChallenges.map(challenge => {
          if (challenge.id === challengeId) {
              // If marking as completed, add to animating challenges
              if (newCompletionState) {
                setAnimatingChallenges(prev => ({
                  ...prev,
                  [challengeId]: true
                }));
                
                // Remove from animating after animation completes
                setTimeout(() => {
                  setAnimatingChallenges(prev => ({
                    ...prev,
                    [challengeId]: false
                  }));
                }, 1000);
                
                // Animate progress bar
                setAnimatingProgress(prev => ({
                  ...prev,
                  [habitId]: true
                }));
                
                setTimeout(() => {
                  setAnimatingProgress(prev => ({
                    ...prev,
                    [habitId]: false
                  }));
                }, 1000);
              }
              
              return {...challenge, completed: newCompletionState};
          }
          return challenge;
        });
        
        // Calculate new progress
        const completedCount = updatedChallenges.filter(c => c.completed).length;
        const progress = Math.round((completedCount / updatedChallenges.length) * 100);
        
        return {...habit, todaysChallenges: updatedChallenges, progress};
      }
      return habit;
      });
      
      // Update state immediately for responsive UI
      setActiveHabits(updatedHabits);
      
      // Find the updated habit
      const updatedHabit = updatedHabits.find(h => h.id === habitId || h._id === habitId);
      if (!updatedHabit) return;
      
      // Check if all challenges are completed
      const allCompleted = updatedHabit.todaysChallenges.every(c => c.completed);
      
      // Format completed challenges according to the backend model
      const formattedCompletedChallenges = updatedHabit.todaysChallenges
        .filter(c => c.completed)
        .map(c => ({
          challengeId: c.id.toString(), // Ensure challengeId is a string
          completedAt: new Date().toISOString() // Format date as ISO string
        }));
      
      // Save progress to backend
      const response = await api.post(`/api/habits/${habitId}/progress`, {
        isCompleted: allCompleted,
        completedChallenges: formattedCompletedChallenges,
        date: new Date().toISOString() // Add current date
      });
      
      if (response.data.success) {
        // IMPORTANT: Streak is only updated when ALL challenges for a habit are completed
        if (allCompleted) {
          // Show celebration animation
          setCelebratedHabitId(habitId);
          startCelebrationAnimation();
          
          // Update the streak counter
          const streakResponse = await api.get('/api/habits/stats');
          if (streakResponse.data.success) {
            // Calculate total streak from all habits
            const totalStreak = Object.values(streakResponse.data.data.streaks)
              .reduce((total, streak) => total + (streak.current || 0), 0);
            
            setStreak(totalStreak);
          }
        }
      } else {
        // If the backend update failed, revert the UI change
        console.error('Failed to update progress:', response.data);
        setActiveHabits(prevHabits => prevHabits.map(habit => {
          if (habit.id === habitId || habit._id === habitId) {
            const revertedChallenges = habit.todaysChallenges.map(challenge => {
              if (challenge.id === challengeId) {
                return {...challenge, completed: !newCompletionState};
              }
              return challenge;
            });
            
            // Recalculate progress
            const completedCount = revertedChallenges.filter(c => c.completed).length;
            const progress = Math.round((completedCount / revertedChallenges.length) * 100);
            
            return {...habit, todaysChallenges: revertedChallenges, progress};
          }
          return habit;
        }));
        
        Alert.alert(
          'Error',
          'Failed to save progress. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating challenge completion:', error);
      
      // Revert the UI change on error
      setActiveHabits(prevHabits => prevHabits.map(habit => {
        if (habit.id === habitId || habit._id === habitId) {
          const revertedChallenges = habit.todaysChallenges.map(challenge => {
            if (challenge.id === challengeId) {
              return {...challenge, completed: currentChallenge.completed};
            }
            return challenge;
          });
          
          // Recalculate progress
          const completedCount = revertedChallenges.filter(c => c.completed).length;
          const progress = Math.round((completedCount / revertedChallenges.length) * 100);
          
          return {...habit, todaysChallenges: revertedChallenges, progress};
        }
        return habit;
      }));
      
      Alert.alert(
        'Error',
        'Failed to save progress. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToSettings = () => {
    router.push('/(protected)/settings');
  };

  const navigateToStats = () => {
    router.push('/(protected)/stats');
  };

  const navigateToCommunity = () => {
    router.push('/(protected)/community');
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToAdminDashboard = () => {
    router.push('/(protected)/admin-dashboard');
  };

  const renderHabitIcon = (habit) => {
    switch (habit.iconType) {
      case 'material':
        return <MaterialCommunityIcons name={habit.icon} size={24} color="#333" />;
      case 'ionicons':
        return <Ionicons name={habit.icon} size={24} color="#333" />;
      case 'feather':
        return <Feather name={habit.icon} size={24} color="#333" />;
      case 'font-awesome':
        return <FontAwesome5 name={habit.icon} size={24} color="#333" />;
      default:
        return <Ionicons name="leaf" size={24} color="#333" />;
    }
  };

  const renderCategoryIcon = (category) => {
    switch (category.iconType) {
      case 'material':
        return (
          <MaterialCommunityIcons
            name={category.icon}
            size={28}
            color={category.color}
          />
        );
      case 'ionicons':
        return (
          <Ionicons
            name={category.icon}
            size={28}
            color={category.color}
          />
        );
      case 'font-awesome':
        return (
          <FontAwesome5
            name={category.icon}
            size={28}
            color={category.color}
          />
        );
      default:
        return <Ionicons name="leaf" size={28} color={category.color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Network status indicator */}
      <NetworkStatus />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Header with Streak and Settings */}
        <View style={styles.header}>
          <View style={styles.streakContainer}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakValue}>{streak} Days</Text>
          </View>
          <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Explore Habits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Habits</Text>
          <View style={styles.categoriesContainer}>
            <TouchableOpacity 
              style={[
                styles.categoryButton, 
                selectedCategory === null && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Ionicons name="apps" size={28} color="#666" />
              <Text style={styles.categoryName}>All</Text>
            </TouchableOpacity>
            
            {HABIT_CATEGORIES.map((category) => (
              <TouchableOpacity 
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                {renderCategoryIcon(category)}
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
        </View>

          {/* Predefined Habits Collection */}
          <View style={styles.predefinedHabitsContainer}>
            <Text style={styles.predefinedHabitsTitle}>Suggested Habits</Text>
            <View style={styles.predefinedHabitsGrid}>
              {PREDEFINED_HABITS
                .filter(habit => selectedCategory === null || habit.category === selectedCategory)
                .map((habit) => {
                  // Check if this habit is already in active habits
                  const isActive = activeHabits.some(h => 
                    h.name === habit.name || 
                    (h.id && h.id === habit.id)
                  );
            
            return (
                    <TouchableOpacity 
                      key={`predefined-${habit.id}`}
                      style={[
                        styles.predefinedHabitCard,
                        isActive && styles.predefinedHabitCardDisabled
                      ]}
                      onPress={() => !isActive && addHabitToActive(habit)}
                      disabled={isActive}
                    >
                      <View style={styles.predefinedHabitIconContainer}>
                    {renderHabitIcon(habit)}
                  </View>
                      <Text style={styles.predefinedHabitName}>{habit.name}</Text>
                      <Text style={styles.predefinedHabitDescription} numberOfLines={2}>
                        {habit.description}
                      </Text>
                      <View style={styles.predefinedHabitFooter}>
                        <Text style={styles.predefinedHabitCategory}>
                          {HABIT_CATEGORIES.find(cat => cat.id === habit.category)?.name || 'General'}
                        </Text>
                <TouchableOpacity 
                  style={[
                            styles.addToActiveButton,
                            isActive && styles.addToActiveButtonDisabled
                  ]}
                  onPress={() => !isActive && addHabitToActive(habit)}
                  disabled={isActive}
                >
                  <Text style={[
                            styles.addToActiveButtonText,
                            isActive && styles.addToActiveButtonTextDisabled
                  ]}>
                    {isActive ? 'Added' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
                    </TouchableOpacity>
            );
          })}
            </View>
          </View>
        </View>

        {/* Active Habits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Habits</Text>
          
          {activeHabits.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No active habits yet.</Text>
              <Text style={styles.emptyStateSubtext}>Add habits from the list below to get started!</Text>
            </View>
          ) : (
            activeHabits.map((habit) => (
              <View key={`active-${habit.id || habit._id}`} style={styles.habitCard}>
                <View style={styles.habitCardHeader}>
                  <View style={styles.habitIconContainer}>
                    {renderHabitIcon(habit)}
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${habit.progress}%` },
                          animatingProgress[habit.id || habit._id] && styles.progressBarAnimating
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{habit.progress}% completed</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => removeActiveHabit(habit.id)}
                  >
                    <Ionicons name="close" size={20} color="#FF5252" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.challengesContainer}>
                  <Text style={styles.challengesTitle}>Today's Challenges:</Text>
                  {habit.todaysChallenges.map((challenge) => (
                    <Pressable 
                      key={`challenge-${habit.id || habit._id}-${challenge.id}`}
                      style={[
                        styles.challengeItem,
                        animatingChallenges[challenge.id] && styles.challengeItemAnimating
                      ]}
                      onPress={() => toggleChallengeCompletion(habit.id || habit._id, challenge.id)}
                    >
                      <Ionicons 
                        name={challenge.completed ? "checkbox" : "square-outline"} 
                        size={20} 
                        color={challenge.completed ? "#4CAF50" : "#757575"}
                        style={styles.checkboxIcon}
                      />
                      <Text 
                        style={[
                          styles.challengeText,
                          challenge.completed && styles.completedChallengeText
                        ]}
                      >
                        {challenge.text}
                      </Text>
                    </Pressable>
                  ))}
                  
                  <TouchableOpacity 
                    style={styles.addChallengeButton}
                    onPress={() => addChallenge(habit.id)}
                  >
                    <Ionicons name="add" size={16} color="#4CAF50" />
                    <Text style={styles.addChallengeText}>Add Challenge</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Create Custom Habit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Your Own Habit</Text>
          <View style={styles.customHabitCard}>
            <Text style={styles.customHabitDescription}>
              Set your own sustainability goals and track progress.
            </Text>
            <TouchableOpacity
              style={styles.createHabitButton}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.createHabitButtonText}>Create Habit</Text>
            </TouchableOpacity>
          </View>

          {/* Create Habit Modal */}
          <Modal
            visible={isCreateModalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create New Habit</Text>
                  <TouchableOpacity
                    onPress={() => setIsCreateModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.formContainer}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Habit Name *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        formErrors.name && styles.inputError
                      ]}
                      value={newHabit.name}
                      onChangeText={(text) => setNewHabit({...newHabit, name: text})}
                      placeholder="Enter habit name"
                    />
                    {formErrors.name && (
                      <Text style={styles.errorText}>{formErrors.name}</Text>
                    )}
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newHabit.description}
                      onChangeText={(text) => setNewHabit({...newHabit, description: text})}
                      placeholder="Describe your habit"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Challenges</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newHabit.challenges}
                      onChangeText={(text) => setNewHabit({...newHabit, challenges: text})}
                      placeholder="Enter challenges (one per line)"
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Frequency</Text>
                    <View style={styles.frequencyButtons}>
                      {['Daily', 'Weekly', 'Monthly'].map((freq) => (
                        <TouchableOpacity
                          key={`freq-${freq}`}
                          style={[
                            styles.frequencyButton,
                            newHabit.frequency === freq && styles.frequencyButtonActive
                          ]}
                          onPress={() => setNewHabit({...newHabit, frequency: freq})}
                        >
                          <Text style={[
                            styles.frequencyButtonText,
                            newHabit.frequency === freq && styles.frequencyButtonTextActive
                          ]}>
                            {freq}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <View style={styles.reminderContainer}>
                      <Text style={styles.fieldLabel}>Enable Reminders</Text>
                      <Switch
                        value={newHabit.enableReminders}
                        onValueChange={(value) => 
                          setNewHabit({...newHabit, enableReminders: value})
                        }
                        trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
                        thumbColor={newHabit.enableReminders ? '#2e7d32' : '#f5f5f5'}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={createCustomHabit}
                  >
                    <Text style={styles.createButtonText}>Create Habit</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {user && user.role === 'Admin' && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={navigateToAdminDashboard}
          >
            <Ionicons name="settings" size={20} color="white" />
            <Text style={styles.adminButtonText}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Challenge Modal */}
      <Modal
        visible={isAddChallengeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddChallengeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addChallengeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Challenge</Text>
              <TouchableOpacity
                onPress={() => setIsAddChallengeModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.addChallengeModalDescription}>
              Add a new challenge to track for this habit. Be specific about what you want to accomplish.
            </Text>
            
            <TextInput
              style={styles.input}
              value={newChallenge}
              onChangeText={setNewChallenge}
              placeholder="Enter a new challenge"
              multiline={false}
            />

            <View style={styles.addChallengeActionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsAddChallengeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.addButton, 
                  !newChallenge.trim() && styles.addButtonDisabled
                ]}
                onPress={handleAddChallenge}
                disabled={!newChallenge.trim()}
              >
                <Text style={[
                  styles.addButtonText,
                  !newChallenge.trim() && styles.addButtonTextDisabled
                ]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Celebration Modal */}
      {showCelebration && (
        <Modal
          transparent={true}
          visible={showCelebration}
          animationType="none"
          onRequestClose={() => setShowCelebration(false)}
        >
          <View style={styles.celebrationContainer}>
            <Animated.View 
              style={[
                styles.celebrationContent,
                {
                  opacity: celebrationAnimation,
                  transform: [
                    { 
                      scale: celebrationAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.celebrationIconContainer}>
                <Ionicons name="trophy" size={60} color="#FFD700" />
              </View>
              <Text style={styles.celebrationTitle}>Great Job!</Text>
              <Text style={styles.celebrationText}>
                You've completed all challenges for today!
              </Text>
              <Text style={styles.celebrationStreak}>
                Your streak: {streak} days
              </Text>
              <Text style={styles.celebrationNote}>
                Remember: Complete all challenges daily to maintain your streak!
              </Text>
              
              {/* Confetti animation */}
              <Animated.View 
                style={[
                  styles.confettiContainer,
                  {
                    opacity: confettiAnimation,
                    transform: [
                      { 
                        translateY: confettiAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -20]
                        })
                      }
                    ]
                  }
                ]}
              >
                <Ionicons name="star" size={20} color="#FFD700" style={styles.confetti1} />
                <Ionicons name="star" size={20} color="#FFD700" style={styles.confetti2} />
                <Ionicons name="star" size={20} color="#FFD700" style={styles.confetti3} />
              </Animated.View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#2e7d32" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
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
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(protected)/profile')}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'column',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  streakValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  settingsButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  habitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  habitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressBarAnimating: {
    backgroundColor: '#2E7D32',
    transform: [{ scaleY: 1.2 }],
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    padding: 6,
  },
  challengesContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  challengesTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
  },
  challengeItemAnimating: {
    backgroundColor: '#E8F5E9',
    transform: [{ scale: 1.05 }],
  },
  checkboxIcon: {
    marginRight: 8,
  },
  challengeText: {
    fontSize: 14,
    color: '#333',
  },
  completedChallengeText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  addChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addChallengeText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
  },
  habitListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  habitListContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitListIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitListInfo: {
    flex: 1,
  },
  habitListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  habitListDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  addButtonTextDisabled: {
    color: '#888',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#e8f5e9',
  },
  categoryName: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
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
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  customHabitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  customHabitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  createHabitButton: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  createHabitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    flex: 1,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  frequencyButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
    color: '#2e7d32',
  },
  reminderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addChallengeModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  addChallengeModalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  addChallengeActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  adminButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  predefinedHabitsContainer: {
    marginTop: 16,
  },
  predefinedHabitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  predefinedHabitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  predefinedHabitCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  predefinedHabitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  predefinedHabitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  predefinedHabitDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  predefinedHabitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predefinedHabitCategory: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addToActiveButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  addToActiveButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  addToActiveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  addToActiveButtonTextDisabled: {
    color: '#888',
  },
  predefinedHabitCardDisabled: {
    opacity: 0.7,
    backgroundColor: '#f5f5f5',
  },
  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  celebrationContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  celebrationIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  celebrationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  celebrationStreak: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
  },
  celebrationNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti1: {
    position: 'absolute',
    top: '20%',
    left: '20%',
  },
  confetti2: {
    position: 'absolute',
    top: '30%',
    right: '20%',
  },
  confetti3: {
    position: 'absolute',
    bottom: '30%',
    left: '30%',
  },
}); 
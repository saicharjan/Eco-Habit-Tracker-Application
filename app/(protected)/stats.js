import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../config/api';

// Chart import with error handling
let LineChart;
try {
  // Dynamic import to prevent app crash if module is missing
  LineChart = require('react-native-chart-kit').LineChart;
} catch (error) {
  console.warn('react-native-chart-kit not found', error);
  // Create a fallback component
  LineChart = ({ style }) => (
    <View style={[{ padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: 16 }, style]}>
      <Ionicons name="bar-chart-outline" size={40} color="#2e7d32" />
      <Text style={{ marginTop: 10, color: '#666', textAlign: 'center' }}>
        Chart unavailable. {'\n'} Please run 'npm install react-native-chart-kit react-native-svg'
      </Text>
    </View>
  );
}

// Mock data for achievements
const ACHIEVEMENTS = [
  {
    id: '1',
    title: 'Eco Hero',
    description: '10 days streak',
    icon: 'leaf',
    unlocked: true,
    date: '2023-10-15'
  },
  {
    id: '2',
    title: 'Water Saver',
    description: 'Saved 10L water',
    icon: 'water',
    unlocked: true,
    date: '2023-10-10'
  },
  {
    id: '3',
    title: 'Energy Champion',
    description: '30% energy saved',
    icon: 'flash',
    unlocked: true,
    date: '2023-10-05'
  },
  {
    id: '4',
    title: 'Tree Planter',
    description: '5 trees planted',
    icon: 'tree',
    unlocked: false
  }
];

export default function StatsScreen() {
  const router = useRouter();
  const [chartView, setChartView] = useState('weekly');
  const [chartError, setChartError] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load stats data
  const loadStats = async () => {
    try {
      const response = await api.get('/api/habits/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert(
        'Error',
        'Failed to load statistics. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadStats();
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  // Calculate total streak
  const totalStreak = stats ? Object.values(stats.streaks).reduce((total, streak) => total + (streak.current || 0), 0) : 0;

  // Calculate completion rate
  const completionRate = stats ? Object.values(stats.completionRate).filter(Boolean).length / Object.keys(stats.completionRate).length * 100 : 0;

  // Chart data based on stats
  const weeklyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [65, 70, 68, 80, 75, 85, 90], // This should be replaced with actual weekly data
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };
  
  const monthlyData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        data: [60, 70, 80, 85], // This should be replaced with actual monthly data
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#2e7d32"
    },
    fillShadowGradient: 'rgba(46, 125, 50, 0.2)',
    fillShadowGradientOpacity: 0.3,
  };

  const renderChart = () => {
    if (chartError) {
      return (
        <View style={styles.chartFallback}>
          <Ionicons name="bar-chart-outline" size={40} color="#2e7d32" />
          <Text style={styles.chartFallbackText}>
            Unable to load chart.
          </Text>
        </View>
      );
    }

    try {
      return (
        <LineChart
          data={chartView === 'weekly' ? weeklyData : monthlyData}
          width={Dimensions.get("window").width - 40}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
          onError={() => setChartError(true)}
        />
      );
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        <View style={styles.chartFallback}>
          <Ionicons name="bar-chart-outline" size={40} color="#2e7d32" />
          <Text style={styles.chartFallbackText}>
            Unable to load chart.
          </Text>
        </View>
      );
    }
  };

  const navigateToHome = () => {
    router.push('/(protected)/dashboard');
  };

  const navigateToCommunity = () => {
    router.push('/(protected)/community');
  };

  const navigateToProfile = () => {
    router.push('/(protected)/profile');
  };

  const navigateToAchievements = () => {
    router.push('/(protected)/achievements');
  };

  const showHabitDetails = (habitId) => {
    // Show detailed habit information
    router.push(`/(protected)/habit-details/${habitId}`);
  };

  const showImpactDetails = () => {
    // Show detailed environmental impact information
    router.push('/(protected)/impact');
  };

  const shareImpact = () => {
    // Share environmental impact on social media
    Alert.alert(
      'Share Impact',
      'Coming soon! You will be able to share your environmental impact on social media.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Your Eco Journey Section */}
        <View style={styles.journeyCard}>
          <Text style={styles.sectionTitle}>Your Eco Journey at a Glance</Text>
          <Text style={styles.sectionSubtitle}>Track your progress and stay motivated!</Text>
          
          <View style={styles.metricsContainer}>
            <TouchableOpacity 
              style={styles.metricItem}
              onPress={() => showImpactDetails()}
            >
              <Ionicons name="timer-outline" size={24} color="#2e7d32" />
              <Text style={styles.metricValue}>{totalStreak}</Text>
              <Text style={styles.metricLabel}>Day Streak</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.metricItem}
              onPress={navigateToAchievements}
            >
              <Ionicons name="trophy-outline" size={24} color="#2e7d32" />
              <Text style={styles.metricValue}>{stats?.active || 0}</Text>
              <Text style={styles.metricLabel}>Active Habits</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.metricItem}
              onPress={() => showImpactDetails()}
            >
              <MaterialCommunityIcons name="leaf" size={24} color="#2e7d32" />
              <Text style={styles.metricValue}>{Math.round(completionRate)}%</Text>
              <Text style={styles.metricLabel}>Completion Rate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Habit Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Habit Progress</Text>
          
          {stats?.byCategory && Object.entries(stats.byCategory).map(([category, count]) => (
            <TouchableOpacity 
              key={category}
              style={styles.habitProgressItem}
              onPress={() => showHabitDetails(category)}
            >
              <View style={styles.habitProgressHeader}>
                <View style={styles.habitIcon}>
                  <MaterialCommunityIcons 
                    name={category === 'recycle' ? 'recycle' : 
                          category === 'water' ? 'water' : 
                          category === 'energy' ? 'flash' : 'leaf'} 
                    size={20} 
                    color="#333" 
                  />
                </View>
                <Text style={styles.habitName}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                <Text style={styles.progressPercentage}>{count} habits</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${(count / stats.total) * 100}%` }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Trends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progress Trends</Text>
            <View style={styles.chartViewToggle}>
              <TouchableOpacity 
                style={[
                  styles.viewToggleButton, 
                  chartView === 'weekly' && styles.viewToggleButtonActive
                ]}
                onPress={() => setChartView('weekly')}
              >
                <Text style={[
                  styles.viewToggleText,
                  chartView === 'weekly' && styles.viewToggleTextActive
                ]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.viewToggleButton,
                  chartView === 'monthly' && styles.viewToggleButtonActive
                ]}
                onPress={() => setChartView('monthly')}
              >
                <Text style={[
                  styles.viewToggleText,
                  chartView === 'monthly' && styles.viewToggleTextActive
                ]}>Monthly</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            {renderChart()}
          </View>
        </View>

        {/* Positive Impact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Positive Impact</Text>
          
          <TouchableOpacity 
            style={styles.impactCard}
            onPress={showImpactDetails}
          >
            <View style={styles.impactItem}>
              <Ionicons name="trending-up" size={20} color="#2e7d32" />
              <Text style={styles.impactText}>
                {stats?.custom || 0} custom habits created
              </Text>
            </View>
            <View style={styles.progressBarSmall}>
              <View style={[styles.progressBarFill, { width: `${(stats?.custom / stats?.total) * 100}%` }]} />
            </View>
            
            <View style={styles.impactItem}>
              <FontAwesome5 name="tree" size={20} color="#2e7d32" />
              <Text style={styles.impactText}>
                {Math.round(completionRate)}% habit completion rate
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={shareImpact}
            >
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share Impact</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={navigateToHome}>
          <Ionicons name="home-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="stats-chart" size={24} color="#2e7d32" />
          <Text style={[styles.navText, styles.navTextActive]}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={navigateToAchievements}>
          <Ionicons name="trophy-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Achievements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={navigateToCommunity}>
          <Ionicons name="people-outline" size={24} color="#757575" />
          <Text style={styles.navText}>Community</Text>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  journeyCard: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  habitProgressItem: {
    marginBottom: 16,
  },
  habitProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2e7d32',
  },
  chartViewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
  },
  viewToggleButtonActive: {
    backgroundColor: '#e8f5e9',
  },
  viewToggleText: {
    fontSize: 12,
    color: '#666',
  },
  viewToggleTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartFallback: {
    width: Dimensions.get("window").width - 40,
    height: 180,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chartFallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  impactCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  impactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 16,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2e7d32',
    borderRadius: 2,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
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
}); 
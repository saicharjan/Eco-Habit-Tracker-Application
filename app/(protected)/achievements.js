import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Share,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../config/api';

export default function AchievementsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [achievements, setAchievements] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load achievements data
  const loadAchievements = async () => {
    try {
      const response = await api.get('/api/achievements');
      if (response.data.success) {
        setAchievements(response.data.data);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      Alert.alert(
        'Error',
        'Failed to load achievements. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadAchievements();
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  }, []);

  const navigateToHome = () => router.push('/(protected)/dashboard');
  const navigateToStats = () => router.push('/(protected)/stats');
  const navigateToCommunity = () => router.push('/(protected)/community');
  const navigateToProfile = () => router.push('/(protected)/profile');

  const handleShare = async (achievement) => {
    try {
      await Share.share({
        message: `I just earned the ${achievement.title} badge in EcoHabit! 🌱 Join me in making a difference!`,
        title: 'My Eco Achievement'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const showBadgeDetails = (badge) => {
    if (badge.unlocked) {
      Alert.alert(
        badge.title,
        `${badge.description}\nEarned on: ${badge.date}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        badge.title,
        `Complete ${badge.description} to unlock this badge!\nProgress: ${badge.progress}%`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderMilestoneProgress = () => {
    if (!achievements?.nextMilestone) return null;

    return (
      <View style={styles.milestoneCard}>
        <View style={styles.milestoneHeader}>
          <Text style={styles.milestoneTitle}>{achievements.nextMilestone.title}</Text>
          <Text style={styles.milestonePoints}>+{achievements.nextMilestone.reward}</Text>
        </View>
        <Text style={styles.milestoneDescription}>{achievements.nextMilestone.description}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(achievements.nextMilestone.progress / achievements.nextMilestone.total) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {achievements.nextMilestone.progress}/{achievements.nextMilestone.total}
          </Text>
        </View>
      </View>
    );
  };

  const renderBadgesByCategory = () => {
    if (!achievements?.categories) return null;

    return (
      <View style={styles.categoriesContainer}>
        {achievements.categories.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.categoryTitle}>{category.name}</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.badgesScroll}
            >
              {category.badges.map((badge) => (
                <TouchableOpacity
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    !badge.unlocked && styles.badgeCardLocked
                  ]}
                  onPress={() => showBadgeDetails(badge)}
                >
                  <View style={[styles.badgeIcon, { backgroundColor: category.color + '20' }]}>
                    <MaterialCommunityIcons 
                      name={badge.icon} 
                      size={28} 
                      color={badge.unlocked ? category.color : '#999'} 
                    />
                    {!badge.unlocked && (
                      <View style={styles.lockIconContainer}>
                        <Ionicons name="lock-closed" size={12} color="#666" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeDescription} numberOfLines={2}>
                    {badge.description}
                  </Text>
                  <View style={styles.badgeProgress}>
                    <View style={styles.badgeProgressBar}>
                      <View 
                        style={[
                          styles.badgeProgressFill,
                          { width: `${badge.progress}%`, backgroundColor: category.color }
                        ]}
                      />
                    </View>
                    <Text style={styles.badgeProgressText}>{badge.progress}%</Text>
                  </View>
                  {badge.unlocked && (
                    <TouchableOpacity
                      style={[styles.shareButton, { backgroundColor: category.color }]}
                      onPress={() => handleShare(badge)}
                    >
                      <Ionicons name="share-outline" size={16} color="#fff" />
                      <Text style={styles.shareButtonText}>Share</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>
    );
  };

  const renderLeaderboard = () => {
    if (!achievements?.leaderboard) return null;

    return (
      <View style={styles.leaderboardCard}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.leaderboardTitle}>Top Eco Warriors</Text>
          <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        {achievements.leaderboard.map((user) => (
          <View 
            key={user.id} 
            style={[
              styles.leaderboardItem,
              user.name === 'You' && styles.leaderboardItemHighlighted
            ]}
          >
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>#{user.rank}</Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userPoints}>{user.points} pts</Text>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading achievements...</Text>
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
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Achievements</Text>
            <Text style={styles.headerSubtitle}>Track your eco-friendly journey</Text>
          </View>
          <TouchableOpacity 
            style={styles.leaderboardButton}
            onPress={() => setShowLeaderboard(true)}
          >
            <Ionicons name="trophy-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{achievements?.earnedBadges || 0}</Text>
            <Text style={styles.statLabel}>Badges Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{achievements?.totalPoints || 0}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        {/* Next Milestone */}
        {!showLeaderboard && renderMilestoneProgress()}

        {/* Badges by Category */}
        {!showLeaderboard && renderBadgesByCategory()}

        {/* Leaderboard */}
        {showLeaderboard && renderLeaderboard()}
      </ScrollView>

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

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="trophy" size={24} color="#2e7d32" />
          <Text style={[styles.navText, styles.navTextActive]}>Achievements</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  leaderboardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsOverview: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  milestoneCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  milestonePoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2e7d32',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgesScroll: {
    marginLeft: -8,
    marginRight: -8,
  },
  badgeCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeCardLocked: {
    opacity: 0.8,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: '#999',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  badgeProgress: {
    marginTop: 8,
  },
  badgeProgressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 14,
    color: '#666',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaderboardItemHighlighted: {
    backgroundColor: '#e8f5e9',
    margin: 0,
    padding: 12,
    borderRadius: 8,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  userPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
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
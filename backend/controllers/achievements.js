const Achievement = require('../models/Achievement');
const HabitProgress = require('../models/HabitProgress');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user achievements
// @route   GET /api/achievements
// @access  Private
exports.getAchievements = asyncHandler(async (req, res, next) => {
  let achievement = await Achievement.findOne({ user: req.user.id });

  // If no achievement record exists, create one with default values
  if (!achievement) {
    achievement = await Achievement.create({
      user: req.user.id,
      earnedBadges: 0,
      totalPoints: 0,
      nextMilestone: {
        title: "Eco Warrior",
        description: "Complete 50 eco-friendly actions",
        progress: 0,
        total: 50,
        reward: "Gold Badge + 500 Points"
      },
      categories: [
        {
          id: '1',
          name: 'Recycling',
          color: '#4CAF50',
          icon: 'recycle',
          badges: [
            {
              id: 'r1',
              title: 'Recycling Rookie',
              description: 'Recycle for 7 consecutive days',
              icon: 'recycle',
              progress: 0,
              unlocked: false
            },
            {
              id: 'r2',
              title: 'Recycling Pro',
              description: 'Recycle for 30 consecutive days',
              icon: 'recycle',
              progress: 0,
              unlocked: false
            }
          ]
        },
        {
          id: '2',
          name: 'Water Conservation',
          color: '#2196F3',
          icon: 'water',
          badges: [
            {
              id: 'w1',
              title: 'Water Saver',
              description: 'Save 100L of water',
              icon: 'water',
              progress: 0,
              unlocked: false
            },
            {
              id: 'w2',
              title: 'Water Guardian',
              description: 'Save 500L of water',
              icon: 'water',
              progress: 0,
              unlocked: false
            }
          ]
        },
        {
          id: '3',
          name: 'Energy Saving',
          color: '#FFC107',
          icon: 'flash',
          badges: [
            {
              id: 'e1',
              title: 'Energy Conscious',
              description: 'Reduce energy usage by 10%',
              icon: 'flash',
              progress: 0,
              unlocked: false
            }
          ]
        }
      ]
    });
  }

  // Update achievements based on user's progress
  await updateAchievements(achievement);

  res.status(200).json({
    success: true,
    data: achievement
  });
});

// @desc    Update achievement progress
// @route   PUT /api/achievements/:id
// @access  Private
exports.updateAchievement = asyncHandler(async (req, res, next) => {
  const achievement = await Achievement.findOne({ user: req.user.id });

  if (!achievement) {
    return next(new ErrorResponse('Achievement not found', 404));
  }

  // Update the achievement based on the request
  if (req.body.progress !== undefined) {
    // Find the badge in the categories
    for (let category of achievement.categories) {
      const badge = category.badges.find(b => b.id === req.params.id);
      if (badge) {
        badge.progress = req.body.progress;
        if (badge.progress >= 100 && !badge.unlocked) {
          badge.unlocked = true;
          badge.date = Date.now();
          achievement.earnedBadges += 1;
          achievement.totalPoints += 100; // Points for unlocking a badge
        }
        break;
      }
    }
  }

  await achievement.save();

  res.status(200).json({
    success: true,
    data: achievement
  });
});

// Helper function to update achievements based on user's progress
async function updateAchievements(achievement) {
  // Get user's habit progress
  const habitProgress = await HabitProgress.find({ user: achievement.user });

  // Update recycling badges
  const recyclingProgress = habitProgress.filter(h => h.habit.category === 'recycle');
  const recyclingStreak = Math.max(...recyclingProgress.map(h => h.streak.current), 0);
  
  const recyclingBadges = achievement.categories
    .find(c => c.id === '1')
    .badges;
  
  recyclingBadges[0].progress = Math.min((recyclingStreak / 7) * 100, 100);
  recyclingBadges[0].unlocked = recyclingStreak >= 7;
  recyclingBadges[1].progress = Math.min((recyclingStreak / 30) * 100, 100);
  recyclingBadges[1].unlocked = recyclingStreak >= 30;

  // Update water conservation badges
  const waterProgress = habitProgress.filter(h => h.habit.category === 'water');
  const waterSaved = waterProgress.reduce((total, h) => total + (h.completedChallenges?.length || 0), 0) * 10; // 10L per challenge
  
  const waterBadges = achievement.categories
    .find(c => c.id === '2')
    .badges;
  
  waterBadges[0].progress = Math.min((waterSaved / 100) * 100, 100);
  waterBadges[0].unlocked = waterSaved >= 100;
  waterBadges[1].progress = Math.min((waterSaved / 500) * 100, 100);
  waterBadges[1].unlocked = waterSaved >= 500;

  // Update energy saving badges
  const energyProgress = habitProgress.filter(h => h.habit.category === 'energy');
  const energyReduction = energyProgress.reduce((total, h) => total + (h.completedChallenges?.length || 0), 0) * 5; // 5% per challenge
  
  const energyBadges = achievement.categories
    .find(c => c.id === '3')
    .badges;
  
  energyBadges[0].progress = Math.min(energyReduction, 100);
  energyBadges[0].unlocked = energyReduction >= 10;

  // Update total points and earned badges
  achievement.earnedBadges = achievement.categories.reduce((total, category) => 
    total + category.badges.filter(b => b.unlocked).length, 0);
  
  achievement.totalPoints = achievement.earnedBadges * 100; // 100 points per badge

  // Update next milestone progress
  const totalActions = habitProgress.reduce((total, h) => 
    total + (h.completedChallenges?.length || 0), 0);
  
  achievement.nextMilestone.progress = totalActions;

  // Update leaderboard (this would typically be handled by a separate service)
  // For now, we'll just update the user's own entry
  const userEntry = achievement.leaderboard.find(entry => entry.name === 'You');
  if (userEntry) {
    userEntry.points = achievement.totalPoints;
  } else {
    achievement.leaderboard.push({
      id: achievement.user.toString(),
      name: 'You',
      points: achievement.totalPoints,
      rank: achievement.leaderboard.length + 1
    });
  }

  // Sort leaderboard by points
  achievement.leaderboard.sort((a, b) => b.points - a.points);
  
  // Update ranks
  achievement.leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  await achievement.save();
} 
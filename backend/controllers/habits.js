const Habit = require('../models/Habit');
const HabitProgress = require('../models/HabitProgress');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get predefined habits
// @route   GET /api/habits/predefined
// @access  Private
exports.getPredefinedHabits = asyncHandler(async (req, res, next) => {
  const habits = await Habit.find({ isCustom: false });
  res.status(200).json({
    success: true,
    count: habits.length,
    data: habits
  });
});

// @desc    Get user's active habits
// @route   GET /api/habits/active
// @access  Private
exports.getActiveHabits = asyncHandler(async (req, res, next) => {
  const habits = await Habit.find({
    createdBy: req.user.id,
    isActive: true
  });
  res.status(200).json({
    success: true,
    count: habits.length,
    data: habits
  });
});

// @desc    Get all habits for a user
// @route   GET /api/habits/user
// @access  Private
exports.getUserHabits = asyncHandler(async (req, res, next) => {
  const habits = await Habit.find({ createdBy: req.user.id });
  res.status(200).json({
    success: true,
    count: habits.length,
    data: habits
  });
});

// @desc    Create new habit
// @route   POST /api/habits
// @access  Private
exports.createHabit = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;
  
  // Create the habit
  const habit = await Habit.create(req.body);

  // Initialize habit progress
  await HabitProgress.create({
    user: req.user.id,
    habit: habit._id,
    streak: {
      current: 0,
      longest: 0,
      lastUpdated: new Date()
    }
  });

  res.status(201).json({
    success: true,
    data: habit
  });
});

// @desc    Update habit
// @route   PUT /api/habits/:id
// @access  Private
exports.updateHabit = asyncHandler(async (req, res, next) => {
  let habit = await Habit.findById(req.params.id);

  if (!habit) {
    return next(new ErrorResponse(`Habit not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns habit
  if (habit.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this habit`, 401));
  }

  habit = await Habit.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: habit
  });
});

// @desc    Delete habit
// @route   DELETE /api/habits/:id
// @access  Private
exports.deleteHabit = asyncHandler(async (req, res, next) => {
  const habit = await Habit.findById(req.params.id);

  if (!habit) {
    return next(new ErrorResponse(`Habit not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns habit
  if (habit.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to delete this habit`, 401));
  }

  // Delete associated progress data
  await HabitProgress.deleteMany({ habit: req.params.id });

  // Delete the habit
  await habit.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Activate habit
// @route   POST /api/habits/:id/activate
// @access  Private
exports.activateHabit = asyncHandler(async (req, res, next) => {
  let habit = await Habit.findById(req.params.id);

  if (!habit) {
    return next(new ErrorResponse(`Habit not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns habit or it's a predefined habit
  if (!habit.isCustom && habit.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to activate this habit`, 401));
  }

  // Check if progress exists, if not create it
  let progress = await HabitProgress.findOne({
    user: req.user.id,
    habit: req.params.id
  });

  if (!progress) {
    progress = await HabitProgress.create({
      user: req.user.id,
      habit: req.params.id,
      streak: {
        current: 0,
        longest: 0,
        lastUpdated: new Date()
      }
    });
  }

  habit.isActive = true;
  await habit.save();

  res.status(200).json({
    success: true,
    data: {
      habit,
      progress
    }
  });
});

// @desc    Deactivate habit
// @route   POST /api/habits/:id/deactivate
// @access  Private
exports.deactivateHabit = asyncHandler(async (req, res, next) => {
  let habit = await Habit.findById(req.params.id);

  if (!habit) {
    return next(new ErrorResponse(`Habit not found with id of ${req.params.id}`, 404));
  }

  habit.isActive = false;
  await habit.save();

  res.status(200).json({
    success: true,
    data: habit
  });
});

// @desc    Update habit progress
// @route   POST /api/habits/:id/progress
// @access  Private
exports.updateHabitProgress = asyncHandler(async (req, res, next) => {
  const habit = await Habit.findById(req.params.id);

  if (!habit) {
    return next(new ErrorResponse(`Habit not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns habit
  if (habit.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this habit's progress`, 401));
  }

  // Find existing progress or create new one
  let progress = await HabitProgress.findOne({
    user: req.user.id,
    habit: req.params.id
  });

  if (!progress) {
    progress = await HabitProgress.create({
      user: req.user.id,
      habit: req.params.id,
      isCompleted: req.body.isCompleted,
      completedChallenges: req.body.completedChallenges || [],
      notes: req.body.notes
    });
  } else {
    progress.isCompleted = req.body.isCompleted;
    progress.completedChallenges = req.body.completedChallenges || [];
    progress.notes = req.body.notes;
    await progress.updateStreak();
  }

  await progress.save();

  res.status(200).json({
    success: true,
    data: progress
  });
});

// @desc    Get habit progress
// @route   GET /api/habits/:id/progress
// @access  Private
exports.getHabitProgress = asyncHandler(async (req, res, next) => {
  const habit = await Habit.findById(req.params.id);

  if (!habit) {
    return next(new ErrorResponse(`Habit not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns habit
  if (habit.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to view this habit's progress`, 401));
  }

  // Get progress
  const progress = await HabitProgress.findOne({
    user: req.user.id,
    habit: req.params.id
  });

  // If no progress exists, create initial progress
  if (!progress) {
    const newProgress = await HabitProgress.create({
      user: req.user.id,
      habit: req.params.id,
      streak: {
        current: 0,
        longest: 0,
        lastUpdated: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      data: newProgress
    });
  }

  res.status(200).json({
    success: true,
    data: progress
  });
});

// @desc    Get habit statistics
// @route   GET /api/habits/stats
// @access  Private
exports.getHabitStats = asyncHandler(async (req, res, next) => {
  // Get all habits for the user
  const habits = await Habit.find({ createdBy: req.user.id });
  
  // Get all progress records for the user
  const progress = await HabitProgress.find({ user: req.user.id });

  // Calculate statistics
  const stats = {
    total: habits.length,
    active: habits.filter(h => h.isActive).length,
    custom: habits.filter(h => h.isCustom).length,
    streaks: progress.reduce((acc, p) => {
      acc[p.habit] = {
        current: p.streak.current,
        longest: p.streak.longest
      };
      return acc;
    }, {}),
    byCategory: habits.reduce((acc, habit) => {
      acc[habit.category] = (acc[habit.category] || 0) + 1;
      return acc;
    }, {}),
    completionRate: progress.reduce((acc, p) => {
      acc[p.habit] = p.isCompleted ? 1 : 0;
      return acc;
    }, {})
  };

  res.status(200).json({
    success: true,
    data: stats
  });
}); 
const User = require('../models/User');
const Project = require('../models/Project');
const Event = require('../models/Event');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get NGO dashboard data
// @route   GET /api/ngo/dashboard
// @access  Private (NGO only)
exports.getNGODashboard = async (req, res, next) => {
  try {
    const ngo = await User.findById(req.user.id).select('-password');
    if (!ngo) {
      return next(new ErrorResponse('NGO not found', 404));
    }

    // Get statistics
    const stats = {
      totalVolunteers: ngo.volunteers.length,
      activeProjects: await Project.countDocuments({ ngo: ngo._id, status: 'active' }),
      totalDonations: ngo.totalDonations || 0,
      upcomingEvents: await Event.countDocuments({ ngo: ngo._id, date: { $gte: new Date() } })
    };

    res.status(200).json({
      success: true,
      data: {
        organization: ngo,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new project
// @route   POST /api/ngo/projects
// @access  Private (NGO only)
exports.createProject = async (req, res, next) => {
  try {
    req.body.ngo = req.user.id;
    const project = await Project.create(req.body);
    
    // Add project to NGO's projects array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { projects: project._id }
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects for the NGO
// @route   GET /api/ngo/projects
// @access  Private (NGO only)
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ ngo: req.user.id });
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/ngo/events
// @access  Private (NGO only)
exports.createEvent = async (req, res, next) => {
  try {
    req.body.ngo = req.user.id;
    const event = await Event.create(req.body);
    
    // Add event to NGO's events array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { events: event._id }
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events for the NGO
// @route   GET /api/ngo/events
// @access  Private (NGO only)
exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ ngo: req.user.id });
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all volunteers for the NGO
// @route   GET /api/ngo/volunteers
// @access  Private (NGO only)
exports.getVolunteers = async (req, res, next) => {
  try {
    const ngo = await User.findById(req.user.id).populate('volunteers');
    res.status(200).json({
      success: true,
      count: ngo.volunteers.length,
      data: ngo.volunteers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a volunteer to the NGO
// @route   POST /api/ngo/volunteers/:volunteerId
// @access  Private (NGO only)
exports.addVolunteer = async (req, res, next) => {
  try {
    const volunteer = await User.findById(req.params.volunteerId);
    if (!volunteer) {
      return next(new ErrorResponse('Volunteer not found', 404));
    }

    const ngo = await User.findById(req.user.id);
    if (ngo.volunteers.includes(volunteer._id)) {
      return next(new ErrorResponse('Volunteer already added', 400));
    }

    ngo.volunteers.push(volunteer._id);
    await ngo.save();

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a donation
// @route   POST /api/ngo/donations
// @access  Private (NGO only)
exports.recordDonation = async (req, res, next) => {
  try {
    const { amount, donorName, donorEmail } = req.body;
    
    const ngo = await User.findById(req.user.id);
    ngo.totalDonations = (ngo.totalDonations || 0) + amount;
    
    // Add donation to donations array
    ngo.donations.push({
      amount,
      donorName,
      donorEmail,
      date: new Date()
    });
    
    await ngo.save();

    res.status(201).json({
      success: true,
      data: ngo.donations[ngo.donations.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations for the NGO
// @route   GET /api/ngo/donations
// @access  Private (NGO only)
exports.getDonations = async (req, res, next) => {
  try {
    const ngo = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      count: ngo.donations.length,
      data: ngo.donations
    });
  } catch (error) {
    next(error);
  }
}; 
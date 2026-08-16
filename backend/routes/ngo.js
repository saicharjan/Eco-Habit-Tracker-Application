const express = require('express');
const router = express.Router();
const {
  getNGODashboard,
  createProject,
  getProjects,
  createEvent,
  getEvents,
  getVolunteers,
  addVolunteer,
  recordDonation,
  getDonations
} = require('../controllers/ngoController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require NGO role
router.use(protect);
router.use(authorize('NGO'));

// Dashboard and Profile
router.get('/dashboard', getNGODashboard);
router.get('/profile', getNGODashboard);

// Projects
router.route('/projects')
  .get(getProjects)
  .post(createProject);

// Events
router.route('/events')
  .get(getEvents)
  .post(createEvent);

// Volunteers
router.route('/volunteers')
  .get(getVolunteers);

router.post('/volunteers/:volunteerId', addVolunteer);

// Donations
router.route('/donations')
  .get(getDonations)
  .post(recordDonation);

module.exports = router; 
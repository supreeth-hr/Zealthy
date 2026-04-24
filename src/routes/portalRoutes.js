const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const authorizePatient = require('../middleware/authorizePatient');
const {
  getPortalUpcomingPrescriptions,
  getPortalAllPrescriptions,
  getPortalAllAppointments,
  getPortalUpcomingAppointments,
} = require('../controllers/portalController');

const router = express.Router();

router.get('/api/portal/prescriptions/:userId', authenticateToken, authorizePatient, getPortalUpcomingPrescriptions);
router.get('/api/portal/allprescriptions/:userId', authenticateToken, authorizePatient, getPortalAllPrescriptions);
router.get('/api/portal/allappointments/:userId', authenticateToken, authorizePatient, getPortalAllAppointments);
router.get('/api/portal/appointments/:userId', authenticateToken, authorizePatient, getPortalUpcomingAppointments);

module.exports = router;

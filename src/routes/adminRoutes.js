const express = require('express');
const {
  getPatients,
  postPatient,
  putPatient,
  putPatientPassword,
  postAppointment,
  putAppointment,
  removeAppointment,
  getUpcomingAppointmentsForAdmin,
  getAllAppointmentsForAdmin,
  postPrescription,
  putPrescription,
  removePrescription,
  getUpcomingPrescriptionsForAdmin,
  getAllPrescriptionsForAdmin,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/api/admin/patients', getPatients);
router.post('/api/admin/patients', postPatient);
router.put('/api/admin/patients/:userId', putPatient);
router.put('/api/admin/patients/:userId/password', putPatientPassword);

router.post('/api/admin/patients/:userId/appointments', postAppointment);
router.put('/api/admin/patients/:userId/appointments/:id', putAppointment);
router.delete('/api/admin/patients/:userId/appointments/:id', removeAppointment);
router.get('/api/admin/patients/:userId/appointments/upcoming', getUpcomingAppointmentsForAdmin);
router.get('/api/admin/patients/:userId/allappointments', getAllAppointmentsForAdmin);

router.post('/api/admin/patients/:userId/prescriptions', postPrescription);
router.put('/api/admin/patients/:userId/prescriptions/:id', putPrescription);
router.delete('/api/admin/patients/:userId/prescriptions/:id', removePrescription);
router.get('/api/admin/patients/:userId/prescriptions/upcoming', getUpcomingPrescriptionsForAdmin);
router.get('/api/admin/patients/:userId/allprescriptions', getAllPrescriptionsForAdmin);

module.exports = router;

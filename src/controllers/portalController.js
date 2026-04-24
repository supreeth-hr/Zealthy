const { mapUpcomingAppointmentsForResponse, mapUpcomingPrescriptionsForResponse } = require('../utils/scheduling');
const { getUpcomingAppointments, getAllAppointmentsForPatient } = require('../services/appointmentService');
const { getUpcomingPrescriptions, getAllPrescriptionsForPatient } = require('../services/prescriptionService');

const getPortalUpcomingPrescriptions = async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getUpcomingPrescriptions(userId);
    res.json(mapUpcomingPrescriptionsForResponse(prescriptions));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPortalAllPrescriptions = async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getAllPrescriptionsForPatient(userId);
    res.json(prescriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPortalAllAppointments = async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getAllAppointmentsForPatient(userId);
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPortalUpcomingAppointments = async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getUpcomingAppointments(userId);
    res.json(mapUpcomingAppointmentsForResponse(appointments));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getPortalUpcomingPrescriptions,
  getPortalAllPrescriptions,
  getPortalAllAppointments,
  getPortalUpcomingAppointments,
};

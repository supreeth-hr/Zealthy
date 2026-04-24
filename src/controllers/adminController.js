const { mapUpcomingAppointmentsForResponse, mapUpcomingPrescriptionsForResponse } = require('../utils/scheduling');
const {
  listPatients,
  createPatient,
  updatePatient,
  updatePatientPassword,
} = require('../services/patientService');
const {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAllAppointmentsForPatient,
  getUpcomingAppointments,
} = require('../services/appointmentService');
const {
  createPrescription,
  updatePrescription,
  deletePrescription,
  getAllPrescriptionsForPatient,
  getUpcomingPrescriptions,
} = require('../services/prescriptionService');

const getPatients = async (_req, res) => {
  try {
    const patients = await listPatients();
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const postPatient = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const patient = await createPatient(name, email, password);
    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const putPatient = async (req, res) => {
  const { userId } = req.params;
  const { name, email } = req.body;
  try {
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const result = await updatePatient(userId, name, email);
    if (!result.rowCount) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const putPatientPassword = async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }
    const result = await updatePatientPassword(userId, password);
    if (!result.rowCount) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const postAppointment = async (req, res) => {
  const { userId } = req.params;
  const { provider, datetime, repeat } = req.body;
  try {
    const appointment = await createAppointment(userId, provider, datetime, repeat);
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const putAppointment = async (req, res) => {
  const { userId, id } = req.params;
  const { provider, datetime, repeat } = req.body;
  try {
    const result = await updateAppointment(userId, id, provider, datetime, repeat);
    if (!result.rowCount) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeAppointment = async (req, res) => {
  const { userId, id } = req.params;
  try {
    const result = await deleteAppointment(userId, id);
    if (!result.rowCount) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUpcomingAppointmentsForAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getUpcomingAppointments(userId);
    res.json(mapUpcomingAppointmentsForResponse(appointments));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllAppointmentsForAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getAllAppointmentsForPatient(userId);
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const postPrescription = async (req, res) => {
  const { userId } = req.params;
  const { medication, dosage, quantity, refill_on: refillOn, refill_schedule: refillSchedule } = req.body;
  try {
    const prescription = await createPrescription(userId, medication, dosage, quantity, refillOn, refillSchedule);
    res.status(201).json(prescription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const putPrescription = async (req, res) => {
  const { userId, id } = req.params;
  const { medication, dosage, quantity, refill_on: refillOn, refill_schedule: refillSchedule } = req.body;
  try {
    const result = await updatePrescription(userId, id, medication, dosage, quantity, refillOn, refillSchedule);
    if (!result.rowCount) return res.status(404).json({ error: 'Prescription not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const removePrescription = async (req, res) => {
  const { userId, id } = req.params;
  try {
    const result = await deletePrescription(userId, id);
    if (!result.rowCount) return res.status(404).json({ error: 'Prescription not found' });
    res.json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUpcomingPrescriptionsForAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getUpcomingPrescriptions(userId);
    res.json(mapUpcomingPrescriptionsForResponse(prescriptions));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllPrescriptionsForAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getAllPrescriptionsForPatient(userId);
    res.json(prescriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
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
};

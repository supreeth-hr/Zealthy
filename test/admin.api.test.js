const request = require('supertest');

jest.mock('../src/controllers/adminController', () => ({
  getPatients: jest.fn((req, res) => res.json([{ id: 1, email: 'patient@example.com' }])),
  postPatient: jest.fn((req, res) => res.status(201).json({ id: 2, ...req.body })),
  putPatient: jest.fn((req, res) => res.json({ id: Number(req.params.userId), ...req.body })),
  putPatientPassword: jest.fn((req, res) => res.json({ id: Number(req.params.userId), message: 'Password updated' })),
  postAppointment: jest.fn((req, res) => res.status(201).json({ id: 11, ...req.body })),
  putAppointment: jest.fn((req, res) => res.json({ id: Number(req.params.id), ...req.body })),
  removeAppointment: jest.fn((req, res) => res.json({ message: 'Appointment deleted successfully' })),
  getUpcomingAppointmentsForAdmin: jest.fn((req, res) => res.json([])),
  getAllAppointmentsForAdmin: jest.fn((req, res) => res.json([])),
  postPrescription: jest.fn((req, res) => res.status(201).json({ id: 21, ...req.body })),
  putPrescription: jest.fn((req, res) => res.json({ id: Number(req.params.id), ...req.body })),
  removePrescription: jest.fn((req, res) => res.json({ message: 'Prescription deleted successfully' })),
  getUpcomingPrescriptionsForAdmin: jest.fn((req, res) => res.json([])),
  getAllPrescriptionsForAdmin: jest.fn((req, res) => res.json([])),
}));

const adminController = require('../src/controllers/adminController');
const app = require('../src/app');

describe('Admin API', () => {
  test('GET /api/admin/patients returns patients list', async () => {
    const response = await request(app).get('/api/admin/patients');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, email: 'patient@example.com' }]);
    expect(adminController.getPatients).toHaveBeenCalled();
  });

  test('POST /api/admin/patients creates a patient', async () => {
    const payload = { name: 'New Patient', email: 'new@example.com', password: 'abc123' };
    const response = await request(app).post('/api/admin/patients').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 2, ...payload });
    expect(adminController.postPatient).toHaveBeenCalled();
  });

  test('POST /api/admin/patients/:userId/appointments creates appointment', async () => {
    const payload = { provider: 'Dr. Mock', datetime: '2026-05-10T10:00:00Z', repeat: 'none' };
    const response = await request(app).post('/api/admin/patients/7/appointments').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 11, ...payload });
    expect(adminController.postAppointment).toHaveBeenCalled();
  });

  test('DELETE /api/admin/patients/:userId/appointments/:id removes appointment', async () => {
    const response = await request(app).delete('/api/admin/patients/7/appointments/11');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Appointment deleted successfully' });
    expect(adminController.removeAppointment).toHaveBeenCalled();
  });

  test('POST /api/admin/patients/:userId/prescriptions creates prescription', async () => {
    const payload = { medication: 'MedA', dosage: '10mg', quantity: 20, refill_on: '2026-05-11', refill_schedule: 'monthly' };
    const response = await request(app).post('/api/admin/patients/7/prescriptions').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 21, ...payload });
    expect(adminController.postPrescription).toHaveBeenCalled();
  });

  test('PUT /api/admin/patients/:userId/prescriptions/:id can surface server error', async () => {
    adminController.putPrescription.mockImplementationOnce((req, res) => {
      res.status(500).json({ error: 'Server error' });
    });

    const response = await request(app)
      .put('/api/admin/patients/7/prescriptions/21')
      .send({ medication: 'MedA', dosage: '10mg', quantity: 10, refill_on: '2026-05-12', refill_schedule: 'monthly' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Server error' });
  });
});

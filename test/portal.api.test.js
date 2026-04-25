const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/controllers/portalController', () => ({
  getPortalUpcomingPrescriptions: jest.fn((req, res) => res.json([{ id: 1, medication: 'MockMed' }])),
  getPortalAllPrescriptions: jest.fn((req, res) => res.json([])),
  getPortalAllAppointments: jest.fn((req, res) => res.json([])),
  getPortalUpcomingAppointments: jest.fn((req, res) => res.json([])),
}));

const portalController = require('../src/controllers/portalController');
const app = require('../src/app');

describe('Portal API', () => {
  describe('GET /api/portal/prescriptions/:userId', () => {
    test('returns 401 when authorization header is missing', async () => {
      const response = await request(app).get('/api/portal/prescriptions/1');

      expect(response.status).toBe(401);
      expect(portalController.getPortalUpcomingPrescriptions).not.toHaveBeenCalled();
    });

    test('returns 403 when token user does not match requested user', async () => {
      const token = jwt.sign({ userId: 999, email: 'other@example.com' }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/api/portal/prescriptions/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Access denied. Unauthorized data access.' });
      expect(portalController.getPortalUpcomingPrescriptions).not.toHaveBeenCalled();
    });

    test('returns 200 with payload when token is valid and authorized', async () => {
      const token = jwt.sign({ userId: 7, email: 'patient@example.com' }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/api/portal/prescriptions/7')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, medication: 'MockMed' }]);
      expect(portalController.getPortalUpcomingPrescriptions).toHaveBeenCalled();
    });

    test('returns 500 when controller reports server error', async () => {
      portalController.getPortalUpcomingPrescriptions.mockImplementationOnce((req, res) => {
        res.status(500).json({ error: 'Server error' });
      });
      const token = jwt.sign({ userId: 7, email: 'patient@example.com' }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/api/portal/prescriptions/7')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Server error' });
    });
  });
});

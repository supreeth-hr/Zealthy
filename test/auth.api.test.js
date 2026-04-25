const request = require('supertest');

jest.mock('../src/services/authService', () => ({
  loginPatient: jest.fn(),
}));

const { loginPatient } = require('../src/services/authService');
const app = require('../src/app');

describe('Auth API', () => {
  describe('POST /api/login', () => {
    test('returns 200 with auth payload on valid credentials', async () => {
      loginPatient.mockResolvedValue({
        token: 'fake-token',
        user: { id: 1, email: 'patient@example.com' },
      });

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'patient@example.com', password: 'good-password' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: 'fake-token',
        user: { id: 1, email: 'patient@example.com' },
      });
      expect(loginPatient).toHaveBeenCalledWith('patient@example.com', 'good-password');
    });

    test('returns 401 when credentials are invalid', async () => {
      loginPatient.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'patient@example.com', password: 'bad-password' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    test('returns 500 when auth service throws', async () => {
      loginPatient.mockRejectedValue(new Error('service failure'));

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'patient@example.com', password: 'good-password' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Server error' });
    });
  });
});

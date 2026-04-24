const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

// Middleware to verify JWT for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

//Login for Patient portal
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const row = userRes.rows[0];
    const match = await bcrypt.compare(password, row.password);

    if (match) {
      const token = jwt.sign({ userId: row.id, email: row.email }, JWT_SECRET, { expiresIn: '1h' });
      const user = { ...row };
      delete user.password;
      res.json({ token, user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

//Admin Routes
// ---------- Patients ----------
app.get('/api/admin/patients', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/patients', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, hashed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/patients/:userId', async (req, res) => {
  const { userId } = req.params;
  const { name, email } = req.body;
  try {
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const result = await db.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
      [name, email, userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/patients/:userId/password', async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Appointments ----------
app.post('/api/admin/patients/:userId/appointments', async (req, res) => {
  const { userId } = req.params;
  const { provider, datetime, repeat } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO appointments (user_id, provider, datetime, repeat)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         user_id,
         provider,
         to_char(datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS datetime,
         repeat,
         to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') AS created_at`,
      [userId, provider, datetime, repeat || 'none']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/patients/:userId/appointments/:id', async (req, res) => {
  const { userId, id } = req.params;
  const { provider, datetime, repeat } = req.body;
  try {
    const result = await db.query(
      `UPDATE appointments
       SET provider = $1, datetime = $2, repeat = $3
       WHERE id = $4 AND user_id = $5
       RETURNING
         id,
         user_id,
         provider,
         to_char(datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS datetime,
         repeat,
         to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') AS created_at`,
      [provider, datetime, repeat, id, userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/patients/:userId/appointments/:id', async (req, res) => {
  const { userId, id } = req.params;
  try {
    const result = await db.query('DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (!result.rowCount) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: upcoming appointments (up to 3 months) for a patient
app.get('/api/admin/patients/:userId/appointments/upcoming', async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getUpcomingAppointments(userId);
    res.json(mapUpcomingAppointmentsForResponse(appointments));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: all appointment rows for a patient (no expansion filter)
app.get('/api/admin/patients/:userId/allappointments', async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getAllAppointmentsForPatient(userId);
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Prescriptions ----------
app.post('/api/admin/patients/:userId/prescriptions', async (req, res) => {
  const { userId } = req.params;
  const { medication, dosage, quantity, refill_on, refill_schedule } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO prescriptions (user_id, medication, dosage, quantity, refill_on, refill_schedule) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, medication, dosage, quantity, refill_on, refill_schedule]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/patients/:userId/prescriptions/:id', async (req, res) => {
  const { userId, id } = req.params;
  const { medication, dosage, quantity, refill_on, refill_schedule } = req.body;
  try {
    const result = await db.query(
      `UPDATE prescriptions SET medication = $1, dosage = $2, quantity = $3, refill_on = $4, refill_schedule = $5 WHERE id = $6 AND user_id = $7 RETURNING *`,
      [medication, dosage, quantity, refill_on, refill_schedule, id, userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Prescription not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/patients/:userId/prescriptions/:id', async (req, res) => {
  const { userId, id } = req.params;
  try {
    const result = await db.query('DELETE FROM prescriptions WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (!result.rowCount) return res.status(404).json({ error: 'Prescription not found' });
    res.json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/patients/:userId/prescriptions/upcoming', async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getUpcomingPrescriptions(userId);
    res.json(mapUpcomingPrescriptionsForResponse(prescriptions));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: all prescription rows for a patient
app.get('/api/admin/patients/:userId/allprescriptions', async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getAllPrescriptionsForPatient(userId);
    res.json(prescriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

//Patient Routes
// Authorization middleware – ensures a patient can only access their own data
const authorizePatient = (req, res, next) => {
  const patientIdFromToken = req.user.userId;
  const requestedId = Number.parseInt(req.params.userId || req.params.id, 10);
  if (patientIdFromToken !== requestedId) {
    return res.status(403).json({ error: 'Access denied. Unauthorized data access.' });
  }
  next();
};

const RECURRING_CADENCES = ['daily', 'weekly', 'monthly', 'yearly'];

const pad2 = (n) => String(n).padStart(2, '0');

const formatNaiveAppointmentDatetime = (d) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatPrescriptionRefillDate = (value) => {
  if (value == null) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

const advanceCalendarStep = (d, cadence, useUtc) => {
  const next = new Date(d.getTime());
  switch (cadence) {
    case 'daily':
      if (useUtc) next.setUTCDate(next.getUTCDate() + 1);
      else next.setDate(next.getDate() + 1);
      return next;
    case 'weekly':
      if (useUtc) next.setUTCDate(next.getUTCDate() + 7);
      else next.setDate(next.getDate() + 7);
      return next;
    case 'monthly':
      if (useUtc) next.setUTCMonth(next.getUTCMonth() + 1);
      else next.setMonth(next.getMonth() + 1);
      return next;
    case 'yearly':
      if (useUtc) next.setUTCFullYear(next.getUTCFullYear() + 1);
      else next.setFullYear(next.getFullYear() + 1);
      return next;
    default:
      return null;
  }
};

const horizonThreeMonthsFromNow = () => {
  const t = new Date();
  t.setMonth(t.getMonth() + 3);
  return t;
};

const mapUpcomingAppointmentsForResponse = (appointments) => {
  const result = appointments.map((appt) => ({
    provider: appt.provider,
    datetime: formatNaiveAppointmentDatetime(appt.occurrence),
    repeat: appt.repeat,
  }));
  result.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  return result;
};

const mapUpcomingPrescriptionsForResponse = (prescriptions) => {
  const result = prescriptions.map((pres) => ({
    medication: pres.medication,
    dosage: pres.dosage,
    quantity: pres.quantity,
    refill_on: formatPrescriptionRefillDate(pres.occurrence),
    schedule: pres.refill_schedule,
  }));
  result.sort((a, b) => new Date(a.refill_on) - new Date(b.refill_on));
  return result;
};

const getUpcomingAppointments = async (userId) => {
  const now = new Date();
  const threeMonthsLater = horizonThreeMonthsFromNow();

  const result = await db.query('SELECT * FROM appointments WHERE user_id = $1 ORDER BY datetime ASC', [userId]);
  const rows = result.rows;
  const expanded = [];

  rows.forEach((appt) => {
    const start = new Date(appt.datetime);
    const repeat = appt.repeat?.toLowerCase();
    if (!repeat || repeat === 'none') {
      if (start >= now && start <= threeMonthsLater) {
        expanded.push({ ...appt, occurrence: start });
      }
      return;
    }
    if (!RECURRING_CADENCES.includes(repeat)) return;
    for (let d = new Date(start); d <= threeMonthsLater; ) {
      if (d >= now) {
        expanded.push({ ...appt, occurrence: new Date(d) });
      }
      const next = advanceCalendarStep(d, repeat, false);
      if (!next || next.getTime() <= d.getTime()) break;
      d = next;
    }
  });

  expanded.sort((a, b) => a.occurrence - b.occurrence);
  return expanded;
};

const getUpcomingPrescriptions = async (userId) => {
  const now = new Date();
  const threeMonthsLater = horizonThreeMonthsFromNow();

  const result = await db.query(
    'SELECT * FROM prescriptions WHERE user_id = $1 ORDER BY refill_on ASC',
    [userId]
  );
  const rows = result.rows;
  const expanded = [];

  rows.forEach((pres) => {
    const start = new Date(pres.refill_on);
    const schedule = pres.refill_schedule?.toLowerCase();
    if (!schedule || schedule === 'none') {
      if (start >= now && start <= threeMonthsLater) {
        expanded.push({ ...pres, occurrence: start });
      }
      return;
    }
    if (!RECURRING_CADENCES.includes(schedule)) return;
    for (let d = new Date(start); d <= threeMonthsLater; ) {
      if (d >= now) {
        expanded.push({ ...pres, occurrence: new Date(d) });
      }
      const next = advanceCalendarStep(d, schedule, true);
      if (!next || next.getTime() <= d.getTime()) break;
      d = next;
    }
  });

  expanded.sort((a, b) => a.occurrence - b.occurrence);
  return expanded;
};

const getAllPrescriptionsForPatient = async (userId) => {
  const result = await db.query(
    `SELECT *
     FROM prescriptions
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows;
};

const getAllAppointmentsForPatient = async (userId) => {
  const result = await db.query(
    `SELECT
       id,
       user_id,
       provider,
       to_char(datetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS datetime,
       repeat,
       to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') AS created_at
     FROM appointments
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows;
};

app.get('/api/portal/prescriptions/:userId', authenticateToken, authorizePatient, async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getUpcomingPrescriptions(userId);
    res.json(mapUpcomingPrescriptionsForResponse(prescriptions));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/portal/allprescriptions/:userId', authenticateToken, authorizePatient, async (req, res) => {
  const { userId } = req.params;
  try {
    const prescriptions = await getAllPrescriptionsForPatient(userId);
    res.json(prescriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/portal/allappointments/:userId', authenticateToken, authorizePatient, async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getAllAppointmentsForPatient(userId);
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/portal/appointments/:userId', authenticateToken, authorizePatient, async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await getUpcomingAppointments(userId);
    res.json(mapUpcomingAppointmentsForResponse(appointments));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
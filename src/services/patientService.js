const bcrypt = require('bcrypt');
const db = require('../db');

const listPatients = async () => {
  const result = await db.query('SELECT id, name, email FROM users ORDER BY id ASC');
  return result.rows;
};

const createPatient = async (name, email, password) => {
  const hashed = await bcrypt.hash(password, 10);
  const result = await db.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, hashed]
  );
  return result.rows[0];
};

const updatePatient = async (userId, name, email) => {
  const result = await db.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
    [name, email, userId]
  );
  return result;
};

const updatePatientPassword = async (userId, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.query(
    'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email',
    [hashedPassword, userId]
  );
  return result;
};

module.exports = {
  listPatients,
  createPatient,
  updatePatient,
  updatePatientPassword,
};

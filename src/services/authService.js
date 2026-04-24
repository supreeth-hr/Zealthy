const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const loginPatient = async (email, password) => {
  const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) return null;

  const row = userRes.rows[0];
  const match = await bcrypt.compare(password, row.password);
  if (!match) return null;

  const token = jwt.sign({ userId: row.id, email: row.email }, JWT_SECRET, { expiresIn: '1h' });
  const user = { ...row };
  delete user.password;
  return { token, user };
};

module.exports = {
  loginPatient,
};

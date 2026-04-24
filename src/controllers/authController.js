const { loginPatient } = require('../services/authService');

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const authData = await loginPatient(email, password);
    if (!authData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(authData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  login,
};

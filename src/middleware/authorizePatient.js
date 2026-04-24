const authorizePatient = (req, res, next) => {
  const patientIdFromToken = req.user.userId;
  const requestedId = Number.parseInt(req.params.userId || req.params.id, 10);

  if (patientIdFromToken !== requestedId) {
    return res.status(403).json({ error: 'Access denied. Unauthorized data access.' });
  }

  next();
};

module.exports = authorizePatient;

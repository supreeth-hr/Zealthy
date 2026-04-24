const db = require('../db');
const {
  RECURRING_CADENCES,
  advanceCalendarStep,
  horizonThreeMonthsFromNow,
} = require('../utils/scheduling');

const createPrescription = async (userId, medication, dosage, quantity, refillOn, refillSchedule) => {
  const result = await db.query(
    `INSERT INTO prescriptions (user_id, medication, dosage, quantity, refill_on, refill_schedule) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, medication, dosage, quantity, refillOn, refillSchedule]
  );
  return result.rows[0];
};

const updatePrescription = async (userId, id, medication, dosage, quantity, refillOn, refillSchedule) => {
  return db.query(
    `UPDATE prescriptions SET medication = $1, dosage = $2, quantity = $3, refill_on = $4, refill_schedule = $5 WHERE id = $6 AND user_id = $7 RETURNING *`,
    [medication, dosage, quantity, refillOn, refillSchedule, id, userId]
  );
};

const deletePrescription = async (userId, id) => {
  return db.query('DELETE FROM prescriptions WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
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

module.exports = {
  createPrescription,
  updatePrescription,
  deletePrescription,
  getAllPrescriptionsForPatient,
  getUpcomingPrescriptions,
};

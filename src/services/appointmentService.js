const db = require('../db');
const {
  RECURRING_CADENCES,
  advanceCalendarStep,
  horizonThreeMonthsFromNow,
} = require('../utils/scheduling');

const createAppointment = async (userId, provider, datetime, repeat) => {
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
  return result.rows[0];
};

const updateAppointment = async (userId, id, provider, datetime, repeat) => {
  return db.query(
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
};

const deleteAppointment = async (userId, id) => {
  return db.query('DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
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

module.exports = {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAllAppointmentsForPatient,
  getUpcomingAppointments,
};

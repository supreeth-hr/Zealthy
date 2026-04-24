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

module.exports = {
  RECURRING_CADENCES,
  advanceCalendarStep,
  horizonThreeMonthsFromNow,
  mapUpcomingAppointmentsForResponse,
  mapUpcomingPrescriptionsForResponse,
};

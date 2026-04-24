const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');

async function seed() {
  try {
    // 1. Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schemaSql);
    console.log('Schema created successfully.');

    // 2. Read data.json
    const dataPath = path.join(__dirname, '..', 'data.json');
    const dataRaw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(dataRaw);

    // 3. Insert Users, Appointments, and Prescriptions
    for (const user of data.users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const userRes = await db.query(
        'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
        [user.id, user.name, user.email, hashedPassword]
      );
      const userId = userRes.rows[0].id;

      // Insert appointments
      if (user.appointments && user.appointments.length > 0) {
        for (const appt of user.appointments) {
          await db.query(
            'INSERT INTO appointments (id, user_id, provider, datetime, repeat) VALUES ($1, $2, $3, $4, $5)',
            [appt.id, userId, appt.provider, appt.datetime, appt.repeat]
          );
        }
      }

      // Insert prescriptions
      if (user.prescriptions && user.prescriptions.length > 0) {
        for (const rx of user.prescriptions) {
          await db.query(
            'INSERT INTO prescriptions (id, user_id, medication, dosage, quantity, refill_on, refill_schedule) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [rx.id, userId, rx.medication, rx.dosage, rx.quantity, rx.refill_on, rx.refill_schedule]
          );
        }
      }
    }
    
    // reset sequence for id's since we hardcoded them
    await db.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));");
    await db.query("SELECT setval('appointments_id_seq', (SELECT MAX(id) FROM appointments));");
    await db.query("SELECT setval('prescriptions_id_seq', (SELECT MAX(id) FROM prescriptions));");

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    db.pool.end();
  }
}

seed();

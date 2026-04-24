# Zealthy Backend

Node.js + Express backend for the Zealthy healthcare portal. This service provides:
- patient login with JWT authentication
- admin APIs for patients, appointments, and prescriptions
- patient portal APIs protected by token + ownership checks

## Tech Stack

- Node.js (CommonJS)
- Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)

## Project Structure

```text
src/
  app.js
  index.js
  db.js
  routes/
    authRoutes.js
    adminRoutes.js
    portalRoutes.js
  controllers/
    authController.js
    adminController.js
    portalController.js
  services/
    authService.js
    patientService.js
    appointmentService.js
    prescriptionService.js
  middleware/
    authenticateToken.js
    authorizePatient.js
  utils/
    scheduling.js
```

## Environment Variables

Create a local `.env` file (do not commit it). You can copy from `.env.example`.

Required variables:

```env
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432
POSTGRES_DB=your_db_name
JWT_SECRET=your_jwt_secret
PORT=3000
```

## Getting Started (Local)

1. Install dependencies:

```bash
npm install
```

2. Ensure PostgreSQL is running and your DB/tables exist.

### Use the committed Docker Compose for local Postgres

This repository includes a committed `docker-compose.yml` that starts a PostgreSQL container for local development.

Start DB:

```bash
docker compose up -d
```

Stop DB:

```bash
docker compose down
```

Then connect using your `.env` values (default local mapping uses port `5433` on host).

3. Start in development mode:

```bash
npm run dev
```

4. Or run normally:

```bash
npm start
```

Server runs on `http://localhost:3000` by default.

## Authentication Model

- `POST /api/login` returns a JWT token on success.
- Protected portal routes require:
  - `Authorization: Bearer <token>`
  - token user id must match `:userId` path param (ownership guard)

## API Endpoints

### Auth

- `POST /api/login`

### Admin - Patients

- `GET /api/admin/patients`
- `POST /api/admin/patients`
- `PUT /api/admin/patients/:userId`
- `PUT /api/admin/patients/:userId/password`

### Admin - Appointments

- `POST /api/admin/patients/:userId/appointments`
- `PUT /api/admin/patients/:userId/appointments/:id`
- `DELETE /api/admin/patients/:userId/appointments/:id`
- `GET /api/admin/patients/:userId/appointments/upcoming`
- `GET /api/admin/patients/:userId/allappointments`

### Admin - Prescriptions

- `POST /api/admin/patients/:userId/prescriptions`
- `PUT /api/admin/patients/:userId/prescriptions/:id`
- `DELETE /api/admin/patients/:userId/prescriptions/:id`
- `GET /api/admin/patients/:userId/prescriptions/upcoming`
- `GET /api/admin/patients/:userId/allprescriptions`

### Portal (JWT + ownership protected)

- `GET /api/portal/prescriptions/:userId`
- `GET /api/portal/allprescriptions/:userId`
- `GET /api/portal/allappointments/:userId`
- `GET /api/portal/appointments/:userId`

## Notes on Date/Time Fields

- Appointment create/update/all endpoints return formatted timestamp strings.
- Upcoming endpoints use recurrence expansion logic for up to 3 months.

## Deployment (Render)

1. Create PostgreSQL service first.
2. Create Web Service from this repo.
3. Set:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add all env vars from above (use Render internal DB host for backend-to-DB connection).
5. Deploy and check logs for successful startup.

## Security Notes

- Never commit `.env`.
- Rotate secrets if exposed.
- Keep `JWT_SECRET` strong and random.

## Available Scripts

- `npm start` - run backend
- `npm run dev` - run with nodemon

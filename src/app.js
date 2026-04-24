const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use(adminRoutes);
app.use(portalRoutes);

module.exports = app;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const controlRoutes = require('./routes/controlRoutes');
const authRoutes = require('./routes/authRoutes'); // Para login/registro

const app = express();

app.use(cors());
app.use(express.json()); // Protección básica contra inyecciones y manejo de JSON

// Rutas
app.use('/api/controles', controlRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.send("Backend funcionando en Vercel 🚀");
});

module.exports = app;
const path = require("path");
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const controlRoutes = require('./routes/controlRoutes');
const authRoutes = require('./routes/authRoutes'); // Para login/registro

const app = express();

// servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, "frontend")));
app.use(cors());
app.use(express.json()); // Protección básica contra inyecciones y manejo de JSON

// Rutas
app.use('/api/controles', controlRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/pages/login.html"));
});

app.get("/registro.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/pages/registro.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/pages/dashboard.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});

module.exports = app;

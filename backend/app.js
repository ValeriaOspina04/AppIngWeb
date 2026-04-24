const express = require('express');
const cors = require('cors');
const path = require('path');
const controlRoutes = require('./routes/controlRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares - IMPORTANTE: Antes de las rutas
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
// Usamos .. para salir de la carpeta 'backend' y entrar a 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// RUTAS DE LA API
app.use('/api/controles', controlRoutes);
app.use('/api/auth', authRoutes);

// RUTAS DE NAVEGACIÓN (Rutas limpias)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/login.html"));
});

app.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/registro.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/dashboard.html"));
});

// Manejo de errores 404 para rutas no encontradas
app.use((req, res) => {
    res.status(404).send("Lo siento, no pudimos encontrar esa página.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});

module.exports = app;

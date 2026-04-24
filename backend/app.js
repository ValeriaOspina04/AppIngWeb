const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const controlRoutes = require('./routes/controlRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Esta es la clave: 
// '__dirname' es la carpeta 'backend'. 
// '..' sale de 'backend' para encontrar 'frontend'.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rutas de navegación
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'registro.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'dashboard.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/controles', controlRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

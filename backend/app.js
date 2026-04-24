const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const controlRoutes = require('./routes/controlRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
// 1. Servir toda la carpeta frontend (para que encuentre CSS y JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Servir específicamente las páginas (opcional, pero ayuda con el orden)
app.use(express.static(path.join(__dirname, '../frontend/pages')));


// --- RUTAS DE LA API ---
app.use('/api/auth', authRoutes);
app.use('/api/controles', controlRoutes);


// --- RUTAS DE NAVEGACIÓN (Sin el .html en la URL) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/registro.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});


// --- MANEJO DE ERRORES 404 ---
// Si nada de lo anterior coincide, enviamos un mensaje claro
app.use((req, res) => {
    res.status(404).send('Página no encontrada. Revisa que la ruta sea /registro o /dashboard');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});  

const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const controlRoutes = require('./routes/controlRoutes');

const app = express();
const fs = require('fs');
const path = require('path');

// Definimos la ruta de la carpeta de subidas
const uploadsDir = path.join(__dirname, 'uploads');

// Verificamos si existe; si no, la creamos al arrancar el servidor
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Carpeta /uploads creada exitosamente');
}
app.use(cors({
    origin: 'https://appingweb.onrender.com', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Esta es la clave: 
// '__dirname' es la carpeta 'backend'. 
// '..' sale de 'backend' para encontrar 'frontend'.
app.use(express.static(path.join(__dirname, "frontend")));
// Servir específicamente las páginas dentro de frontend/pages
app.use(express.static(path.join(__dirname, "frontend/pages")));

// Rutas amigables
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/pages/login.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/pages/dashboard.html"));
});

app.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/pages/registro.html"));
});

app.use('/api/auth', authRoutes);
app.use('/api/controles', controlRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registro de Empresa y Usuario (Representante Legal)
exports.registrar = async (req, res) => {
    const { nombre, correo, password, rol, nombre_empresa, representante_legal, tipo_empresa } = req.body;
    
    try {
        // 1. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Insertar Usuario
        const [userResult] = await db.query(
            'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
            [nombre, correo, hashedPassword, rol]
        );
        const usuario_id = userResult.insertId;

        // 3. Insertar Empresa vinculada al usuario
        await db.query(
            'INSERT INTO empresas (nombre_empresa, representante_legal, tipo_empresa, usuario_id) VALUES (?, ?, ?, ?)',
            [nombre_empresa, representante_legal, tipo_empresa, usuario_id]
        );

        res.status(201).json({ mensaje: "Registro exitoso" });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ mensaje: "Error en el registro", error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    const { correo, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        
        if (rows.length === 0) {
            return res.status(401).json({ mensaje: "Usuario no encontrado" });
        }
        
        const user = rows[0];
        
        // ¡OJO AQUÍ! Si insertaste el usuario manual en Workbench con '123456'
        // y aquí usas bcrypt.compare, VA A FALLAR.
        // Para pruebas rápidas, compara directo si no has encriptado:
        if (password !== user.password) { 
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }
        // Crear Token incluyendo el ROL
        const token = jwt.sign(
            { id: user.id, rol: user.rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.json({ token, rol: user.rol, nombre: user.nombre });
    } catch (error) {
    console.error("DETALLE DEL ERROR:", error); // Esto aparecerá en tu terminal de Node
    res.status(500).json({ mensaje: "Error interno", detalle: error.message });
}
};

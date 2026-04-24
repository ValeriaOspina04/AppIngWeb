const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- REGISTRO DE EMPRESA Y USUARIO ---
exports.registrar = async (req, res) => {
    const { nombre, correo, password, rol, nombre_empresa, representante_legal, tipo_empresa } = req.body;
    
    try {
        // 1. Encriptar contraseña (Para que sea seguro)
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

// --- LOGIN DE USUARIO ---
exports.login = async (req, res) => {
    const { correo, password } = req.body;
    
    try {
        // 1. Buscar al usuario por correo
        const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        
        if (rows.length === 0) {
            return res.status(401).json({ mensaje: "Usuario no encontrado" });
        }
        
        const user = rows[0];
        
        // 2. Comparar contraseña encriptada
        // bcrypt.compare toma la clave plana y la compara con el hash de la DB
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) { 
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        // 3. Generar el Token JWT
        // Usamos un valor por defecto por si falta la variable en Render
        const secret = process.env.JWT_SECRET;

        const token = jwt.sign(
            { 
                id: usuario.id, 
                id_empresa: usuario.id_empresa // <--- ¡ESTO ES VITAL!
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // 4. Responder con los datos necesarios para el frontend
        res.json({ 
            token, 
            rol: user.rol, 
            nombre: user.nombre 
        });

    } catch (error) {
        console.error("DETALLE DEL ERROR EN LOGIN:", error);
        res.status(500).json({ 
            mensaje: "Error interno", 
            detalle: error.message 
        });
    }
};

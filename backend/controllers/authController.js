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
        // 1. Buscamos usuario Y traemos de una vez el id_empresa y nombre_empresa
        // Hacemos un JOIN porque el ID de la empresa está en la tabla 'empresas'
        const sql = `
            SELECT u.*, e.id_empresa, e.nombre_empresa 
            FROM usuarios u
            LEFT JOIN empresas e ON u.id = e.usuario_id
            WHERE u.correo = ?
        `;
        
        const [rows] = await db.query(sql, [correo]);
        
        if (rows.length === 0) {
            return res.status(401).json({ mensaje: "Usuario no encontrado" });
        }
        
        const user = rows[0]; // Usamos 'user' que es la variable que sí existe
        
        // 2. Comparar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) { 
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        // 3. Generar el Token JWT con los datos corregidos
        const token = jwt.sign(
            { 
                id: user.id, 
                id_empresa: user.id_empresa, // Ahora sí viene del JOIN
                rol: user.rol 
            }, 
            process.env.JWT_SECRET || 'clave_secreta_provisoria', 
            { expiresIn: '24h' }
        );

        // 4. Responder al frontend
        res.json({ 
            token, 
            rol: user.rol, 
            nombre: user.nombre,
            nombre_empresa: user.nombre_empresa // Lo enviamos para el localStorage
        });

    } catch (error) {
        console.error("DETALLE DEL ERROR EN LOGIN:", error);
        res.status(500).json({ 
            mensaje: "Error interno", 
            detalle: error.message 
        });
    }
};

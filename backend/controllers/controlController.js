const db = require('../config/db');
const jwt = require('jsonwebtoken');

function obtenerUsuario(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
}

exports.obtenerControles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM controles');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener controles:", error);
        res.status(500).json({ mensaje: "Error al obtener controles" });
    }
};

exports.guardarProgreso = async (req, res) => {
    try {
        const { controles } = req.body;
        const user = obtenerUsuario(req);
        
        if (!user) {
            return res.status(401).json({ mensaje: "No autenticado" });
        }
        const id_empresa = user.id_empresa;

         if (!id_empresa) {
            return res.status(400).json({ mensaje: "Usuario sin empresa" });
        }
        
        const sql = `
            INSERT INTO progreso_checklist 
            (id_empresa, control_id, estado, observaciones, responsable, fecha_limite, link_evidencia) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            estado = VALUES(estado),
            observaciones = VALUES(observaciones),
            responsable = VALUES(responsable),
            fecha_limite = VALUES(fecha_limite),
            link_evidencia = VALUES(link_evidencia)
        `;

        for (const ctrl of controles) {
            await db.query(sql, [
                id_empresa,
                ctrl.control_id,
                ctrl.estado || 'No Iniciado',
                ctrl.observaciones || null,
                ctrl.responsable || null,
                (ctrl.fecha_limite && ctrl.fecha_limite !== "") ? ctrl.fecha_limite : null,
                ctrl.link_evidencia || null
            ]);
        }

        res.json({ mensaje: "¡Progreso guardado con éxito!" });
    } catch (error) {
        console.error("ERROR DB:", error.message);
        res.status(500).json({ mensaje: "Error de base de datos", detalle: error.message });
    }
};

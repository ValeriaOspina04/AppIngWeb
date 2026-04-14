const db = require('../config/db');

exports.obtenerControles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM controles');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener controles" });
    }
};

exports.actualizarProgreso = async (req, res) => {
    const { empresa_id, control_id, estado, observaciones } = req.body;
    try {
        // Implementa lógica de "UPSERT" (Insertar o Actualizar si ya existe)
        const sql = `INSERT INTO progreso_checklist (empresa_id, control_id, estado, observaciones) 
                     VALUES (?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE estado = ?, observaciones = ?`;
        await db.query(sql, [empresa_id, control_id, estado, observaciones, estado, observaciones]);
        res.json({ mensaje: "Progreso guardado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al guardar el progreso" });
    }
};
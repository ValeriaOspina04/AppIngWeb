const db = require('../config/db');

exports.obtenerControles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM controles');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener controles" });
    }
};

exports.guardarAvances = async (req, res) => {
    const { avances } = req.body; // Es el array que enviamos desde el JS del frontend
    const usuario_id = req.user.id; // Obtenido del token JWT a través del middleware

    try {
        // Iniciamos una transacción para asegurar que no haya datos a medias
        await Promise.all(avances.map(item => {
            return db.query(
                `INSERT INTO progreso_checklist 
                    (control_id, usuario_id, estado, observaciones, fecha_actualizacion) 
                VALUES (?, ?, ?, ?, NOW()) 
                ON DUPLICATE KEY UPDATE 
                    estado = VALUES(estado), 
                    observaciones = VALUES(observaciones), 
                    fecha_actualizacion = NOW()`,
                [item.control_id, usuario_id, item.estado, item.observaciones]
            );
        }));

        await db.query('COMMIT');

        res.json({ mensaje: "Progreso guardado exitosamente" });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("error en el guardado:", error);
        res.status(500).json({ mensaje: "Error interno al guardar los avances", detalle: error.message });
    }
};
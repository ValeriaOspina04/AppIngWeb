const db = require('../config/db');

exports.obtenerControles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM controles');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener controles" });
    }
};

exports.guardarProgreso = async (req, res) => {
    const { controles } = req.body;
    const empresa_id = req.user.empresa_id; // Extraído del middleware de Auth

    if (!controles || !Array.isArray(controles)) {
        return res.status(400).json({ mensaje: "Datos inválidos" });
    }

    try {
        // Query con ON DUPLICATE KEY UPDATE para que actualice si ya existe
        const sql = `
            INSERT INTO progreso_checklist 
            (empresa_id, control_id, estado, observaciones, responsable, fecha_limite, link_evidencia) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            estado = VALUES(estado),
            observaciones = VALUES(observaciones),
            responsable = VALUES(responsable),
            fecha_limite = VALUES(fecha_limite),
            link_evidencia = VALUES(link_evidencia)
        `;

        for (const ctrl of controles) {
            try {
                await db.query(sql, [
                    req.user.empresa_id, 
                    ctrl.control_id, 
                    ctrl.estado, 
                    ctrl.observaciones || null, 
                    ctrl.responsable || null, 
                    ctrl.fecha_limite || null, // MySQL acepta NULL en fechas, pero no ""
                    ctrl.link_evidencia || null
                ]);
        res.json({ mensaje: "Progreso actualizado correctamente" });
    } catch (dbErr) {
        console.error(`Error en control ${ctrl.control_id}:`, dbErr.message);
        // Seguimos con el siguiente para que no muera todo el proceso
    }
};

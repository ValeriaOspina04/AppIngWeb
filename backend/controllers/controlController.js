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
            estado = IFNULL(VALUES(estado), estado),
            observaciones = IFNULL(VALUES(observaciones), observaciones),
            responsable = IFNULL(VALUES(responsable), responsable),
            fecha_limite = IFNULL(VALUES(fecha_limite), fecha_limite),
            link_evidencia = IFNULL(VALUES(link_evidencia), link_evidencia)
        `;

        for (const ctrl of controles) {
            await db.query(sql, [
                empresa_id, 
                ctrl.control_id, 
                ctrl.estado, 
                ctrl.observaciones, 
                ctrl.responsable, 
                ctrl.fecha_limite, 
                ctrl.link_evidencia
            ]);
        }

        res.json({ mensaje: "Progreso actualizado correctamente" });
    } catch (error) {
        console.error("Error en DB:", error);
        res.status(500).json({ mensaje: "Error interno del servidor", detalle: error.message });
    }
};

const db = require('../config/db');

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
        const empresa_id = req.user.empresa_id;

        if (!controles || !Array.isArray(controles)) {
            return res.status(400).json({ mensaje: "Datos inválidos" });
        }

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

        // Procesamos uno por uno para mayor seguridad en el log
        for (const ctrl of controles) {
            // Validamos que los campos vacíos sean NULL para que MySQL no proteste
            await db.query(sql, [
                empresa_id,
                ctrl.control_id,
                ctrl.estado || 'No Iniciado',
                ctrl.observaciones || null,
                ctrl.responsable || null,
                (ctrl.fecha_limite && ctrl.fecha_limite !== "") ? ctrl.fecha_limite : null,
                ctrl.link_evidencia || null
            ]);
        }

        res.json({ mensaje: "Progreso actualizado correctamente" });
    } catch (error) {
        console.error("Error en DB:", error);
        res.status(500).json({ mensaje: "Error interno del servidor", detalle: error.message });
    }
};

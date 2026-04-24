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
        // Si req.user no existe o no tiene empresa_id, usamos 1 como respaldo para pruebas
        const empresa_id = (req.user && req.user.empresa_id) ? req.user.empresa_id : 1; 

        console.log("Guardando para empresa:", empresa_id);

        if (!controles || !Array.isArray(controles)) {
            return res.status(400).json({ mensaje: "No hay datos para guardar" });
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

        for (const ctrl of controles) {
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

        res.json({ mensaje: "¡Progreso guardado con éxito!" });
    } catch (error) {
        console.error("ERROR DB:", error.message);
        res.status(500).json({ mensaje: "Error de base de datos", detalle: error.message });
    }
};

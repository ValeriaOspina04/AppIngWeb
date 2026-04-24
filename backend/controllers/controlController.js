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
       // 1. Buscamos el id_empresa usando el nombre
        const [empresa] = await db.query(
            'SELECT id_empresa FROM empresas WHERE nombre_empresa = ?', 
            [nombre_empresa]
        );

        if (empresa.length === 0) {
            return res.status(404).json({ mensaje: "Empresa no encontrada: " + nombre_empresa });
        }

        const id_actual = empresa[0].id_empresa;

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

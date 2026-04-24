const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        console.log("❌ No llegó el header de Authorization");
        return res.status(403).send("Token requerido");
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verifica que JWT_SECRET tenga valor
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_temporal_si_no_hay_env');
        console.log("✅ Token decodificado con éxito para el usuario:", decoded.id);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("❌ Error al verificar token:", err.message);
        return res.status(401).send("Token inválido");
    }
};

module.exports = verificarToken;

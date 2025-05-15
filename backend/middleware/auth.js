const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const verificarAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }
  next();
};

const verificarAdminOComerciante = (req, res, next) => {
  if (!req.usuario || (req.usuario.rol !== 'administrador' && req.usuario.rol !== 'comerciante')) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador o comerciante' });
  }
  next();
};

module.exports = { verificarToken, verificarAdmin, verificarAdminOComerciante };
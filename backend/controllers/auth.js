const verificarTokenHandler = (req, res) => {
    // Si el middleware verificarToken pasó, el token es válido
    res.json({ mensaje: 'Token válido', usuario: req.usuario });
  };
  
  module.exports = { verificarTokenHandler };
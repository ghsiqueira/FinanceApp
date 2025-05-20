// finance-app-server/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura';

module.exports = (req, res, next) => {
  // Obter token do header
  const token = req.header('x-auth-token');
  
  // Verificar se token existe
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }
  
  try {
    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Adicionar userId à requisição
    req.user = decoded.userId;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
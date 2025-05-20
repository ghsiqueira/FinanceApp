// finance-app-server/middleware/auth.js - Updated version with debug logging
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura';

module.exports = (req, res, next) => {
  // Obter token do header
  const token = req.header('x-auth-token');
  
  // Log para debug
  console.log(`Middleware de autenticação - Rota: ${req.method} ${req.originalUrl}`);
  
  // Verificar se token existe
  if (!token) {
    console.log('Token não fornecido');
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }
  
  try {
    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Adicionar userId à requisição
    req.user = decoded.userId;
    console.log(`Usuário autenticado: ${req.user}`);
    
    next();
  } catch (error) {
    console.log(`Token inválido: ${error.message}`);
    res.status(401).json({ message: 'Token inválido' });
  }
};
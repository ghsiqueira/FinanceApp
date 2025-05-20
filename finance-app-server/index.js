// finance-app-server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Importar as rotas
const transactionsRoutes = require('./routes/transactions');
const goalsRoutes = require('./routes/goals');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth'); // Nova rota de autenticação

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB Atlas'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Definir rotas
app.use('/api/transactions', transactionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/auth', authRoutes); // Adicionar rota de autenticação

// Rota padrão
app.get('/', (req, res) => {
  res.send('API de Gestão de Finanças está funcionando!');
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
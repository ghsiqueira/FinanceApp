// finance-app-server/scripts/initDb.js
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Categorias padrão
const defaultCategories = [
  // Categorias de receita
  {
    name: 'Salário',
    color: '#4CAF50',
    icon: 'cash',
    type: 'income'
  },
  {
    name: 'Freelance',
    color: '#8BC34A',
    icon: 'laptop',
    type: 'income'
  },
  {
    name: 'Investimentos',
    color: '#009688',
    icon: 'chart-line',
    type: 'income'
  },
  {
    name: 'Presente',
    color: '#E91E63',
    icon: 'gift',
    type: 'income'
  },
  
  // Categorias de despesa
  {
    name: 'Alimentação',
    color: '#FF5722',
    icon: 'food',
    type: 'expense'
  },
  {
    name: 'Transporte',
    color: '#3F51B5',
    icon: 'car',
    type: 'expense'
  },
  {
    name: 'Moradia',
    color: '#795548',
    icon: 'home',
    type: 'expense'
  },
  {
    name: 'Saúde',
    color: '#F44336',
    icon: 'hospital',
    type: 'expense'
  },
  {
    name: 'Educação',
    color: '#9C27B0',
    icon: 'school',
    type: 'expense'
  },
  {
    name: 'Lazer',
    color: '#FF9800',
    icon: 'movie',
    type: 'expense'
  },
  {
    name: 'Compras',
    color: '#2196F3',
    icon: 'cart',
    type: 'expense'
  },
  {
    name: 'Assinaturas',
    color: '#607D8B',
    icon: 'newspaper-variant',
    type: 'expense'
  }
];

// Função para inicializar o banco de dados
async function initializeDb() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');
    
    // Verificar se já existem categorias
    const count = await Category.countDocuments();
    
    if (count === 0) {
      // Inserir categorias padrão
      await Category.insertMany(defaultCategories);
      console.log('Categorias padrão criadas com sucesso!');
    } else {
      console.log('O banco de dados já possui categorias. Nenhuma categoria foi adicionada.');
    }
    
    console.log('Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
  } finally {
    // Fechar conexão
    mongoose.connection.close();
  }
}

// Executar inicialização
initializeDb();
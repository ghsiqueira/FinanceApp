// finance-app-server/routes/categories.js - Updated version with debug logging
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth'); // Import auth middleware

// Apply auth middleware to all routes
router.use(auth);

// Obter todas as categorias do usuário atual
router.get('/', async (req, res) => {
  try {
    console.log(`Buscando categorias para o usuário: ${req.user}`);
    const categories = await Category.find({ user: req.user }).sort({ name: 1 });
    console.log(`${categories.length} categorias encontradas`);
    res.json(categories);
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
});

// Obter uma categoria específica
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      _id: req.params.id,
      user: req.user // Garante que a categoria pertence ao usuário
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    
    res.json(category);
  } catch (err) {
    console.error('Erro ao buscar categoria:', err);
    res.status(500).json({ message: 'Erro ao buscar categoria' });
  }
});

// Criar uma nova categoria
router.post('/', async (req, res) => {
  try {
    // Certifique-se de que a categoria pertence ao usuário atual
    const newCategory = new Category({
      ...req.body,
      user: req.user // Garante que a categoria é criada para o usuário atual
    });
    
    console.log(`Criando categoria para usuário ${req.user}:`, newCategory);
    const savedCategory = await newCategory.save();
    console.log('Categoria criada:', savedCategory);
    res.status(201).json(savedCategory);
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    res.status(400).json({ message: 'Erro ao criar categoria', error: err.message });
  }
});

// Atualizar uma categoria
router.put('/:id', async (req, res) => {
  try {
    // Certifique-se de que apenas o proprietário pode atualizar
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      req.body,
      { new: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    
    res.json(updatedCategory);
  } catch (err) {
    console.error('Erro ao atualizar categoria:', err);
    res.status(400).json({ message: 'Erro ao atualizar categoria', error: err.message });
  }
});

// Excluir uma categoria (verificando se não está em uso)
router.delete('/:id', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const Goal = require('../models/Goal');
    
    // Verificar se a categoria está sendo usada em transações
    const transactionCount = await Transaction.countDocuments({ 
      category: req.params.id,
      user: req.user // Garante que verificamos apenas as transações do usuário
    });
    
    if (transactionCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir a categoria pois ela está sendo usada em transações' 
      });
    }
    
    // Verificar se a categoria está sendo usada em metas
    const goalCount = await Goal.countDocuments({ 
      category: req.params.id,
      user: req.user // Garante que verificamos apenas as metas do usuário
    });
    
    if (goalCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir a categoria pois ela está sendo usada em metas' 
      });
    }
    
    // Garante que apenas o proprietário pode excluir
    const deletedCategory = await Category.findOneAndDelete({ 
      _id: req.params.id,
      user: req.user 
    });
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    
    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir categoria:', err);
    res.status(500).json({ message: 'Erro ao excluir categoria' });
  }
});

module.exports = router;
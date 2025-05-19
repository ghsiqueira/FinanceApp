// finance-app-server/routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Obter todas as categorias
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
});

// Obter uma categoria específica
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
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
    const newCategory = new Category(req.body);
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    res.status(400).json({ message: 'Erro ao criar categoria', error: err.message });
  }
});

// Atualizar uma categoria
router.put('/:id', async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
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
    const transactionCount = await Transaction.countDocuments({ category: req.params.id });
    if (transactionCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir a categoria pois ela está sendo usada em transações' 
      });
    }
    
    // Verificar se a categoria está sendo usada em metas
    const goalCount = await Goal.countDocuments({ category: req.params.id });
    if (goalCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir a categoria pois ela está sendo usada em metas' 
      });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    
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
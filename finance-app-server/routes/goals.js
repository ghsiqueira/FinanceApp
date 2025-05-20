// finance-app-server/routes/goals.js - Fixed version
const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth'); // Import auth middleware

// Apply auth middleware to all routes
router.use(auth);

// Obter todas as metas
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user })
      .sort({ createdAt: -1 })
      .populate('category', 'name color icon');
    res.json(goals);
  } catch (err) {
    console.error('Erro ao buscar metas:', err);
    res.status(500).json({ message: 'Erro ao buscar metas' });
  }
});

// Obter uma meta específica
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user
    }).populate('category', 'name color icon');
    
    if (!goal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    res.json(goal);
  } catch (err) {
    console.error('Erro ao buscar meta:', err);
    res.status(500).json({ message: 'Erro ao buscar meta' });
  }
});

// Criar uma nova meta
router.post('/', async (req, res) => {
  try {
    // Make sure the goal belongs to the current user
    const newGoal = new Goal({
      ...req.body,
      user: req.user // Ensure user ID is set from auth token
    });
    
    const savedGoal = await newGoal.save();
    
    const populatedGoal = await Goal.findById(savedGoal._id)
      .populate('category', 'name color icon');
    
    res.status(201).json(populatedGoal);
  } catch (err) {
    console.error('Erro ao criar meta:', err);
    res.status(400).json({ message: 'Erro ao criar meta', error: err.message });
  }
});

// Atualizar uma meta
router.put('/:id', async (req, res) => {
  try {
    // Ensure only the owner can update
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      req.body,
      { new: true }
    ).populate('category', 'name color icon');
    
    if (!updatedGoal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    res.json(updatedGoal);
  } catch (err) {
    console.error('Erro ao atualizar meta:', err);
    res.status(400).json({ message: 'Erro ao atualizar meta', error: err.message });
  }
});

// Excluir uma meta
router.delete('/:id', async (req, res) => {
  try {
    // Ensure only the owner can delete
    const deletedGoal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user
    });
    
    if (!deletedGoal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    res.json({ message: 'Meta excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir meta:', err);
    res.status(500).json({ message: 'Erro ao excluir meta' });
  }
});

// Adicionar valor a uma meta
router.post('/:id/add', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Valor inválido' });
    }
    
    // Find goal and ensure it belongs to the current user
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    goal.currentAmount += amount;
    
    // Verificar se a meta foi alcançada
    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
    }
    
    const updatedGoal = await goal.save();
    const populatedGoal = await Goal.findById(updatedGoal._id)
      .populate('category', 'name color icon');
    
    res.json(populatedGoal);
  } catch (err) {
    console.error('Erro ao adicionar valor à meta:', err);
    res.status(500).json({ message: 'Erro ao adicionar valor à meta' });
  }
});

module.exports = router;
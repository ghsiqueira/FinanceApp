// finance-app-server/routes/transactions.js - Fixed version
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth'); // Import auth middleware

// Apply auth middleware to all routes
router.use(auth);

// Obter todas as transações
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user })
      .sort({ date: -1 })
      .populate('category', 'name color icon');
    res.json(transactions);
  } catch (err) {
    console.error('Erro ao buscar transações:', err);
    res.status(500).json({ message: 'Erro ao buscar transações' });
  }
});

// Obter uma transação específica
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user
    }).populate('category', 'name color icon');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error('Erro ao buscar transação:', err);
    res.status(500).json({ message: 'Erro ao buscar transação' });
  }
});

// Criar uma nova transação
router.post('/', async (req, res) => {
  try {
    // Make sure the transaction belongs to the current user
    const newTransaction = new Transaction({
      ...req.body,
      user: req.user // Ensure user ID is set from auth token
    });
    
    const savedTransaction = await newTransaction.save();
    
    const populatedTransaction = await Transaction.findById(savedTransaction._id)
      .populate('category', 'name color icon');
    
    res.status(201).json(populatedTransaction);
  } catch (err) {
    console.error('Erro ao criar transação:', err);
    res.status(400).json({ message: 'Erro ao criar transação', error: err.message });
  }
});

// Atualizar uma transação
router.put('/:id', async (req, res) => {
  try {
    // Ensure only the owner can update
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      req.body,
      { new: true }
    ).populate('category', 'name color icon');
    
    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    res.json(updatedTransaction);
  } catch (err) {
    console.error('Erro ao atualizar transação:', err);
    res.status(400).json({ message: 'Erro ao atualizar transação', error: err.message });
  }
});

// Excluir uma transação
router.delete('/:id', async (req, res) => {
  try {
    // Ensure only the owner can delete
    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user
    });
    
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    res.json({ message: 'Transação excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir transação:', err);
    res.status(500).json({ message: 'Erro ao excluir transação' });
  }
});

// Obter resumo de transações por mês
router.get('/summary/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const transactions = await Transaction.find({
      user: req.user, // Only get the current user's transactions
      date: { $gte: startDate, $lte: endDate }
    }).populate('category', 'name color icon');
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    res.json({ income, expense, balance, transactions });
  } catch (err) {
    console.error('Erro ao buscar resumo mensal:', err);
    res.status(500).json({ message: 'Erro ao buscar resumo mensal' });
  }
});

module.exports = router;
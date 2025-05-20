// finance-app-server/routes/recurringTransactions.js
const express = require('express');
const router = express.Router();
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth'); // Importar middleware de autenticação

// Aplicar middleware de autenticação a todas as rotas
router.use(auth);

// Obter todas as transações recorrentes do usuário
router.get('/', async (req, res) => {
  try {
    const recurringTransactions = await RecurringTransaction.find({ user: req.user })
      .sort({ createdAt: -1 })
      .populate('category', 'name color icon');
    
    res.json(recurringTransactions);
  } catch (err) {
    console.error('Erro ao buscar transações recorrentes:', err);
    res.status(500).json({ message: 'Erro ao buscar transações recorrentes' });
  }
});

// Obter uma transação recorrente específica
router.get('/:id', async (req, res) => {
  try {
    const recurringTransaction = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user
    }).populate('category', 'name color icon');
    
    if (!recurringTransaction) {
      return res.status(404).json({ message: 'Transação recorrente não encontrada' });
    }
    
    res.json(recurringTransaction);
  } catch (err) {
    console.error('Erro ao buscar transação recorrente:', err);
    res.status(500).json({ message: 'Erro ao buscar transação recorrente' });
  }
});

// Criar nova transação recorrente
router.post('/', async (req, res) => {
  try {
    // Garantir que o usuário correto seja associado à transação
    const newRecurringTransaction = new RecurringTransaction({
      ...req.body,
      user: req.user // Definir usuário a partir do token
    });
    
    const savedRecurringTransaction = await newRecurringTransaction.save();
    
    const populatedTransaction = await RecurringTransaction.findById(savedRecurringTransaction._id)
      .populate('category', 'name color icon');
    
    res.status(201).json(populatedTransaction);
  } catch (err) {
    console.error('Erro ao criar transação recorrente:', err);
    res.status(400).json({ message: 'Erro ao criar transação recorrente', error: err.message });
  }
});

// Atualizar transação recorrente
router.put('/:id', async (req, res) => {
  try {
    // Garantir que apenas o proprietário pode atualizar
    const updatedRecurringTransaction = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      req.body,
      { new: true }
    ).populate('category', 'name color icon');
    
    if (!updatedRecurringTransaction) {
      return res.status(404).json({ message: 'Transação recorrente não encontrada' });
    }
    
    res.json(updatedRecurringTransaction);
  } catch (err) {
    console.error('Erro ao atualizar transação recorrente:', err);
    res.status(400).json({ message: 'Erro ao atualizar transação recorrente', error: err.message });
  }
});

// Excluir transação recorrente
router.delete('/:id', async (req, res) => {
  try {
    // Garantir que apenas o proprietário pode excluir
    const deletedRecurringTransaction = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user
    });
    
    if (!deletedRecurringTransaction) {
      return res.status(404).json({ message: 'Transação recorrente não encontrada' });
    }
    
    res.json({ message: 'Transação recorrente excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir transação recorrente:', err);
    res.status(500).json({ message: 'Erro ao excluir transação recorrente' });
  }
});

// Ativar/desativar transação recorrente
router.patch('/:id/toggle', async (req, res) => {
  try {
    const recurringTransaction = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user
    });
    
    if (!recurringTransaction) {
      return res.status(404).json({ message: 'Transação recorrente não encontrada' });
    }
    
    // Inverter status
    recurringTransaction.active = !recurringTransaction.active;
    await recurringTransaction.save();
    
    res.json({
      message: `Transação recorrente ${recurringTransaction.active ? 'ativada' : 'desativada'} com sucesso`,
      active: recurringTransaction.active
    });
  } catch (err) {
    console.error('Erro ao alterar status da transação recorrente:', err);
    res.status(500).json({ message: 'Erro ao alterar status da transação recorrente' });
  }
});

// Gerar transação a partir de recorrente
router.post('/:id/generate', async (req, res) => {
  try {
    const recurringTransaction = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user
    }).populate('category');
    
    if (!recurringTransaction) {
      return res.status(404).json({ message: 'Transação recorrente não encontrada' });
    }
    
    // Criar nova transação baseada na recorrente
    const newTransaction = new Transaction({
      user: req.user,
      amount: recurringTransaction.amount,
      type: recurringTransaction.type,
      category: recurringTransaction.category._id,
      description: recurringTransaction.description,
      date: req.body.date || new Date() // Usar data fornecida ou data atual
    });
    
    const savedTransaction = await newTransaction.save();
    
    // Atualizar lastProcessed da transação recorrente
    recurringTransaction.lastProcessed = new Date();
    await recurringTransaction.save();
    
    const populatedTransaction = await Transaction.findById(savedTransaction._id)
      .populate('category', 'name color icon');
    
    res.status(201).json({
      message: 'Transação gerada com sucesso',
      transaction: populatedTransaction
    });
  } catch (err) {
    console.error('Erro ao gerar transação:', err);
    res.status(500).json({ message: 'Erro ao gerar transação', error: err.message });
  }
});

// Rota administrativa para processar todas as transações recorrentes (chamada via cron job)
router.post('/process-all', async (req, res) => {
  try {
    // Verificar chave de API para acesso restrito
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      return res.status(401).json({ message: 'Acesso não autorizado' });
    }

    const today = new Date();
    const dayOfMonth = today.getDate();
    const month = today.getMonth();
    const dayOfWeek = today.getDay();

    // Buscar todas as transações recorrentes ativas
    const activeRecurringTransactions = await RecurringTransaction.find({
      active: true,
      autoGenerate: true,
      // Verificar data de término (se existir)
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: today } }
      ]
    }).populate('category');

    const generatedTransactions = [];
    const errors = [];

    // Processar cada transação recorrente
    for (const recTransaction of activeRecurringTransactions) {
      try {
        let shouldGenerate = false;

        // Verificar se deve gerar com base na frequência
        switch (recTransaction.frequency) {
          case 'daily':
            shouldGenerate = true;
            break;
          case 'weekly':
            shouldGenerate = dayOfWeek === recTransaction.dayOfWeek;
            break;
          case 'monthly':
            shouldGenerate = dayOfMonth === recTransaction.dayOfMonth;
            break;
          case 'yearly':
            shouldGenerate = 
              month === recTransaction.month && 
              dayOfMonth === recTransaction.dayOfMonth;
            break;
        }

        // Se for o momento de gerar e não foi processada hoje
        if (shouldGenerate) {
          // Verificar se já foi processada hoje
          let alreadyProcessedToday = false;
          
          if (recTransaction.lastProcessed) {
            const lastProcessed = new Date(recTransaction.lastProcessed);
            alreadyProcessedToday = 
              lastProcessed.getDate() === today.getDate() &&
              lastProcessed.getMonth() === today.getMonth() &&
              lastProcessed.getFullYear() === today.getFullYear();
          }

          if (!alreadyProcessedToday) {
            // Criar nova transação
            const newTransaction = new Transaction({
              user: recTransaction.user,
              amount: recTransaction.amount,
              type: recTransaction.type,
              category: recTransaction.category._id,
              description: recTransaction.description,
              date: today
            });

            // Se requer confirmação, apenas notificar (não gerar)
            if (recTransaction.requireConfirmation) {
              // Aqui você pode implementar um sistema de notificação
              // ou guardar em uma tabela de transações pendentes
              console.log(`Transação pendente de confirmação: ${recTransaction._id}`);
            } else {
              // Salvar a nova transação
              const savedTransaction = await newTransaction.save();
              
              // Atualizar o lastProcessed da transação recorrente
              recTransaction.lastProcessed = today;
              await recTransaction.save();
              
              generatedTransactions.push({
                recurringId: recTransaction._id,
                transactionId: savedTransaction._id,
                description: recTransaction.description || 'Transação recorrente',
                amount: recTransaction.amount
              });
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao processar transação recorrente ${recTransaction._id}:`, error);
        errors.push({
          recurringId: recTransaction._id,
          error: error.message
        });
      }
    }

    res.json({
      processed: generatedTransactions.length,
      generatedTransactions,
      errors: errors.length > 0 ? errors : null
    });
  } catch (err) {
    console.error('Erro ao processar transações recorrentes:', err);
    res.status(500).json({ message: 'Erro ao processar transações recorrentes', error: err.message });
  }
});

// Obter próximas ocorrências de uma transação recorrente
router.get('/:id/next-occurrences', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5; // Número de próximas ocorrências para calcular
    
    const recurringTransaction = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user
    });
    
    if (!recurringTransaction) {
      return res.status(404).json({ message: 'Transação recorrente não encontrada' });
    }
    
    // Calcular próximas ocorrências
    const nextOccurrences = [];
    let currentDate = new Date();
    
    // Se houver uma data de término e ela já passou, retornar array vazio
    if (recurringTransaction.endDate && new Date(recurringTransaction.endDate) < currentDate) {
      return res.json([]);
    }
    
    while (nextOccurrences.length < count) {
      let nextDate = null;
      
      switch (recurringTransaction.frequency) {
        case 'daily':
          // Próximo dia
          nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          break;
          
        case 'weekly':
          // Próximo dia da semana correspondente
          nextDate = new Date(currentDate);
          const daysToAdd = (recurringTransaction.dayOfWeek - currentDate.getDay() + 7) % 7;
          nextDate.setDate(nextDate.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
          break;
          
        case 'monthly':
          // Próximo mês, mesmo dia
          nextDate = new Date(currentDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          
          // Ajustar para o dia correto do mês
          const targetDay = recurringTransaction.dayOfMonth;
          
          // Verificar se o dia existe no próximo mês
          const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(targetDay, lastDayOfMonth));
          break;
          
        case 'yearly':
          // Próximo ano, mesmo mês e dia
          nextDate = new Date(currentDate);
          
          // Se o mês atual é antes do mês da recorrência, definir para este ano
          if (currentDate.getMonth() < recurringTransaction.month) {
            nextDate.setFullYear(currentDate.getFullYear());
            nextDate.setMonth(recurringTransaction.month);
            nextDate.setDate(recurringTransaction.dayOfMonth);
          } else {
            // Caso contrário, definir para o próximo ano
            nextDate.setFullYear(currentDate.getFullYear() + 1);
            nextDate.setMonth(recurringTransaction.month);
            nextDate.setDate(recurringTransaction.dayOfMonth);
          }
          break;
      }
      
      // Verificar se está além da data de término
      if (recurringTransaction.endDate && nextDate > new Date(recurringTransaction.endDate)) {
        break;
      }
      
      nextOccurrences.push(nextDate);
      currentDate = nextDate;
    }
    
    res.json(nextOccurrences);
  } catch (err) {
    console.error('Erro ao calcular próximas ocorrências:', err);
    res.status(500).json({ message: 'Erro ao calcular próximas ocorrências' });
  }
});

module.exports = router;
// finance-app-server/models/RecurringTransaction.js
const mongoose = require('mongoose');

const RecurringTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    required: false
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    default: 'monthly'
  },
  // Para frequência semanal
  dayOfWeek: {
    type: Number,  // 0 (domingo) a 6 (sábado)
    required: function() { return this.frequency === 'weekly'; }
  },
  // Para frequência mensal ou anual
  dayOfMonth: {
    type: Number,  // 1 a 31
    required: function() { return ['monthly', 'yearly'].includes(this.frequency); }
  },
  // Para frequência anual
  month: {
    type: Number,  // 0 (janeiro) a 11 (dezembro)
    required: function() { return this.frequency === 'yearly'; }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: false
  },
  lastProcessed: {
    type: Date,
    default: null
  },
  // Se a transação deve ser gerada automaticamente
  autoGenerate: {
    type: Boolean,
    default: true
  },
  // Se a transação precisa de confirmação antes de ser gerada
  requireConfirmation: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RecurringTransaction', RecurringTransactionSchema);
// finance-app-server/models/Goal.js
const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  color: {
    type: String,
    default: '#00FF00'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  // Novos campos
  priority: {
    type: Number,
    enum: [1, 2, 3, 4, 5], // 1: Muito alta, 5: Muito baixa
    default: 3 // Prioridade média como padrão
  },
  monthlyContribution: {
    type: Number,
    default: 0 // Valor sugerido de contribuição mensal
  },
  autoRedistribute: {
    type: Boolean,
    default: true // Se deve redistribuir automaticamente quando concluído
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
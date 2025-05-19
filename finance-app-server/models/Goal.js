// finance-app-server/models/Goal.js
const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    default: 'default_user'
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
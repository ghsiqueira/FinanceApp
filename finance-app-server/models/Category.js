// finance-app-server/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#0000FF'
  },
  icon: {
    type: String,
    default: 'cash'
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'both'
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
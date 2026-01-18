const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true
  },
  isFavorite: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index để ensure unique favorite per user-series
favoriteSchema.index({ userId: 1, seriesId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

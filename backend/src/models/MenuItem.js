const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Menu item price is required'],
      min: [0, 'Price must be non-negative']
    },
    available: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate product entries in the same menu
menuItemSchema.index({ menu: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);

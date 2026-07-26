const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Branch address is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Branch phone is required'],
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    coverImage: {
      type: String,
      default: ''
    },
    isMain: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);

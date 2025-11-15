const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  productCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  category: {
    type: String,
  },
  level: {
    type: String,
  },
  specs: {
    type: String,
    default: 'Regular',
  },
  subject: {
    type: String,
  },
  itemType: {
    type: String,
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
  },
  minStock: {
    type: Number,
    default: 0,
  },
  maxStock: {
    type: Number,
  },
  unitPrice: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  location: {
    type: String,
  },
  supplier: {
    type: String,
  },
  lastRestocked: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
    default: 'In Stock',
  },
}, {
  timestamps: true,
});

// Auto-update status based on stock levels
warehouseSchema.pre('save', function(next) {
  if (this.currentStock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minStock) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

module.exports = mongoose.model('Warehouse', warehouseSchema);


const Product = require('../models/Product');

// Get all products (filtered by status if provided)
const list = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    // If status is provided, filter by it
    if (status !== undefined) {
      filter.prodStatus = Number(status);
    }
    
    const products = await Product.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Get single product
const getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Create new product
const create = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user._id,
    };
    
    // Validate required fields
    if (!payload.productName) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    
    // If hasSubjects is true, ensure subjects array is provided
    if (payload.hasSubjects && (!payload.subjects || payload.subjects.length === 0)) {
      return res.status(400).json({ message: 'Subjects are required when hasSubjects is true' });
    }
    
    // If hasSpecs is true, ensure specs array is provided and not empty
    if (payload.hasSpecs && (!payload.specs || !Array.isArray(payload.specs) || payload.specs.length === 0)) {
      return res.status(400).json({ message: 'At least one spec is required when hasSpecs is true' });
    }
    
    // Ensure specs is always an array (convert if needed for backward compatibility)
    if (payload.specs && !Array.isArray(payload.specs)) {
      payload.specs = [payload.specs];
    }
    
    const product = await Product.create(payload);
    
    const populated = await Product.findById(product._id)
      .populate('createdBy', 'name email');
    
    res.status(201).json(populated);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: 'Product name already exists' });
    }
    res.status(500).json({ message: e.message });
  }
};

// Update product
const update = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update fields
    const updateData = {};
    const fieldsToUpdate = [
      'productName',
      'productLevels',
      'hasSubjects',
      'subjects',
      'hasSpecs',
      'specs',
      'prodStatus',
    ];
    
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // Validate if hasSubjects is true, subjects must be provided
    if (updateData.hasSubjects && (!updateData.subjects || updateData.subjects.length === 0)) {
      // If subjects not in updateData, check existing product
      if (!updateData.subjects && (!product.subjects || product.subjects.length === 0)) {
        return res.status(400).json({ message: 'Subjects are required when hasSubjects is true' });
      }
    }
    
    // Handle specs - ensure it's always an array
    if (updateData.specs !== undefined) {
      // Convert to array if it's not already
      if (!Array.isArray(updateData.specs)) {
        updateData.specs = [updateData.specs];
      }
      // Validate if hasSpecs is true, specs must be provided
      if (updateData.hasSpecs !== undefined && updateData.hasSpecs) {
        if (updateData.specs.length === 0) {
          return res.status(400).json({ message: 'At least one spec is required when hasSpecs is true' });
        }
      }
      // Validate each spec value
      const allowedSpecs = ['Regular', 'Single Level only', 'Class WorkBooks Only'];
      const invalidSpecs = updateData.specs.filter(spec => !allowedSpecs.includes(spec));
      if (invalidSpecs.length > 0) {
        return res.status(400).json({ 
          message: `Invalid specs: ${invalidSpecs.join(', ')}. Allowed values: ${allowedSpecs.join(', ')}` 
        });
      }
    } else if (updateData.hasSpecs !== undefined && updateData.hasSpecs) {
      // If hasSpecs is being set to true but specs not provided, check existing
      const existingSpecs = product.specs || [];
      const specsArray = Array.isArray(existingSpecs) ? existingSpecs : (existingSpecs ? [existingSpecs] : []);
      if (specsArray.length === 0) {
        return res.status(400).json({ message: 'At least one spec is required when hasSpecs is true' });
      }
    }
    
    // Update the product directly to avoid casting issues
    Object.keys(updateData).forEach(key => {
      product[key] = updateData[key];
    });
    
    // Validate before saving
    await product.validate();
    
    // Save the product
    await product.save();
    
    const updatedProduct = await Product.findById(product._id)
      .populate('createdBy', 'name email');
    
    res.json(updatedProduct);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: 'Product name already exists' });
    }
    // Provide more detailed error message
    console.error('Product update error:', e);
    res.status(500).json({ 
      message: e.message || 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};

// Delete product
const remove = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Get active products only (for use throughout the application)
const getActiveProducts = async (req, res) => {
  try {
    const products = await Product.find({ prodStatus: 1 })
      .select('productName productLevels hasSubjects subjects hasSpecs specs')
      .sort({ productName: 1 });
    
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  getActiveProducts,
};


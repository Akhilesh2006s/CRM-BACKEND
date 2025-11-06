// @desc    Get inventory metadata options
// @route   GET /api/metadata/inventory-options
// @access  Private
const getInventoryOptions = async (req, res) => {
  try {
    // These could be stored in a database, but for now returning defaults
    const options = {
      products: [
        'Abacus',
        'EELL',
        'Vedic Maths',
        'Brochure',
        'Profile-Book',
        'MathLab',
        'FACE',
        'NCERT',
        'SCIENCE-LAB',
        'BIOLOGY',
        'PHYSICS',
        'CHEMISTRY',
        'SOCIAL',
        'SCIENCE-LAB-OPERATORS',
        'CHARTS',
        'SY_CHARTS',
        'DVD',
        'SPORTS',
        'PUZZLES',
        'Senior_Math',
        'Math_Lab_Charts',
        'Stickers',
        'Specimens',
        'Jr_Math_Lab',
        'Jr_Math_Lab_Cluster_Boxes_Card',
        'SLIDES',
        'IIT',
        'CodeChamp',
        'Financial Literacy',
        'Brain Bytes',
        'Spelling Bee',
        'Skill Pro',
        'Financial LE',
      ],
      uoms: ['Pieces (pcs)', 'boxes'],
      itemTypes: ['Books', 'Question Paper', 'Instruments'],
      vendors: [
        'Vendor 1',
        'Vendor 2',
        'Vendor 3',
      ],
    };

    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventoryOptions,
};


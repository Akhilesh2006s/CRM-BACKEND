const Lead = require('../models/Lead');
const DcOrder = require('../models/DcOrder');
const User = require('../models/User');

/**
 * Generate a unique school code based on executive's cluster
 * Format: First 2 characters of cluster (lowercase) + 3-digit sequential number
 * Example: "kadc" -> "ka001", "ka002", etc.
 * 
 * @param {String} executiveId - The ID of the executive creating the lead
 * @returns {Promise<String>} - The generated school code
 */
async function generateSchoolCode(executiveId) {
  try {
    // Get the executive's cluster
    const executive = await User.findById(executiveId);
    
    if (!executive) {
      throw new Error('Executive not found');
    }
    
    // Only generate school code for executives
    if (executive.role !== 'Executive') {
      return null; // Return null for non-executives
    }
    
    if (!executive.cluster || !executive.cluster.trim()) {
      throw new Error('Executive cluster is not set. Please set cluster for the executive.');
    }
    
    // Get first 2 characters of cluster (lowercase)
    const clusterPrefix = executive.cluster.trim().substring(0, 2).toLowerCase();
    
    // Find all existing school codes that start with this prefix
    // Check both Lead and DcOrder models
    const existingLeads = await Lead.find({
      school_code: { $regex: `^${clusterPrefix}\\d{3}$`, $options: 'i' }
    }).select('school_code');
    
    const existingDcOrders = await DcOrder.find({
      school_code: { $regex: `^${clusterPrefix}\\d{3}$`, $options: 'i' }
    }).select('school_code');
    
    // Combine all existing school codes
    const allExistingCodes = [
      ...existingLeads.map(l => l.school_code),
      ...existingDcOrders.map(d => d.school_code)
    ].filter(Boolean); // Remove null/undefined values
    
    // Extract numbers from existing codes and find the maximum
    let maxNumber = 0;
    allExistingCodes.forEach(code => {
      if (code) {
        const match = code.match(/\d{3}$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
    
    // Generate next sequential number
    const nextNumber = maxNumber + 1;
    const schoolCode = `${clusterPrefix}${String(nextNumber).padStart(3, '0')}`;
    
    return schoolCode;
  } catch (error) {
    console.error('Error generating school code:', error);
    throw error;
  }
}

module.exports = {
  generateSchoolCode,
};




